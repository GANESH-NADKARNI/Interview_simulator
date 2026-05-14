package com.interviewsim.service;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.interviewsim.model.dto.SubmissionResponse.TestCaseResult;
import com.interviewsim.model.entity.TestCase;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

@Slf4j
@Service
public class CodeExecutionService {

    @Value("${app.docker.execution-timeout-sec:10}")
    private int timeoutSec;

    @Value("${app.docker.memory-limit-mb:256}")
    private int memoryLimitMb;

    public record ExecutionResult(
            List<TestCaseResult> testResults,
            int testsPassed,
            int testsTotal,
            int runtimeMs,
            String errorMessage
    ) {}

    public ExecutionResult execute(String code, String language, List<TestCase> testCases) {
        DockerClient dockerClient = buildDockerClient();
        try {
            String fileName = getFileName(language);
            byte[] tarBytes = createTar(fileName, code);

            List<TestCaseResult> results = new ArrayList<>();
            int totalRuntime = 0;

            for (TestCase tc : testCases) {
                TestCaseResult result = runSingleTestCase(dockerClient, tarBytes, fileName, language, tc);
                results.add(result);
                if (result.getRuntimeMs() != null) totalRuntime += result.getRuntimeMs();
            }

            long passed = results.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();
            return new ExecutionResult(results, (int) passed, testCases.size(), totalRuntime, null);

        } catch (Exception e) {
            log.error("Code execution failed", e);
            return new ExecutionResult(List.of(), 0, testCases.size(), 0, e.getMessage());
        } finally {
            try { dockerClient.close(); } catch (Exception ignored) {}
        }
    }

    private TestCaseResult runSingleTestCase(DockerClient docker, byte[] tarBytes,
                                              String fileName, String language, TestCase tc) {
        String containerId = null;
        try {
            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withMemory((long) memoryLimitMb * 1024 * 1024)
                    .withCpuCount(1L)
                    .withNetworkMode("none");

            String[] cmd = buildRunCommand(language, fileName, tc.getInput());

            CreateContainerResponse container = docker
                    .createContainerCmd(getImage(language))
                    .withHostConfig(hostConfig)
                    .withWorkingDir("/code")
                    .withCmd(cmd)
                    .withTty(false)
                    .exec();

            containerId = container.getId();

            // Copy code into container via tar archive (works on Windows/WSL2)
            docker.copyArchiveToContainerCmd(containerId)
                    .withTarInputStream(new ByteArrayInputStream(tarBytes))
                    .withRemotePath("/code")
                    .exec();

            long startTime = System.currentTimeMillis();
            docker.startContainerCmd(containerId).exec();

            StringBuilder stdout = new StringBuilder();
            StringBuilder stderr = new StringBuilder();

            ExecutorService executor = Executors.newSingleThreadExecutor();
            final String cid = containerId;
            Future<?> future = executor.submit(() -> {
                try {
                    docker.logContainerCmd(cid)
                            .withStdOut(true)
                            .withStdErr(true)
                            .withFollowStream(true)
                            .exec(new com.github.dockerjava.api.async.ResultCallback.Adapter<>() {
                                @Override
                                public void onNext(com.github.dockerjava.api.model.Frame frame) {
                                    String payload = new String(frame.getPayload());
                                    if (frame.getStreamType().name().equals("STDOUT")) {
                                        stdout.append(payload);
                                    } else {
                                        stderr.append(payload);
                                    }
                                }
                            }).awaitCompletion();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });

            try {
                future.get(timeoutSec, TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                future.cancel(true);
                return TestCaseResult.builder()
                        .input(maskInput(tc.getInput()))
                        .expected(tc.getExpectedOutput().trim())
                        .actual("TIME_LIMIT_EXCEEDED")
                        .passed(false)
                        .runtimeMs(timeoutSec * 1000)
                        .hidden(tc.getIsHidden())
                        .build();
            } finally {
                executor.shutdownNow();
            }

            int runtimeMs = (int) (System.currentTimeMillis() - startTime);
            String actual = stdout.toString().trim();
            String expected = tc.getExpectedOutput().trim();
            boolean passed = actual.equals(expected);

            if (!stderr.toString().isBlank() && !passed) {
                return TestCaseResult.builder()
                        .input(maskInput(tc.getInput()))
                        .expected(expected)
                        .actual("RUNTIME_ERROR: " + stderr.toString().trim())
                        .passed(false)
                        .runtimeMs(runtimeMs)
                        .hidden(tc.getIsHidden())
                        .build();
            }

            return TestCaseResult.builder()
                    .input(maskInput(tc.getInput()))
                    .expected(expected)
                    .actual(actual)
                    .passed(passed)
                    .runtimeMs(runtimeMs)
                    .hidden(tc.getIsHidden())
                    .build();

        } catch (Exception e) {
            return TestCaseResult.builder()
                    .input(maskInput(tc.getInput()))
                    .expected(tc.getExpectedOutput().trim())
                    .actual("ERROR: " + e.getMessage())
                    .passed(false)
                    .runtimeMs(0)
                    .hidden(tc.getIsHidden())
                    .build();
        } finally {
            if (containerId != null) {
                try { docker.stopContainerCmd(containerId).exec(); } catch (Exception ignored) {}
                try { docker.removeContainerCmd(containerId).withForce(true).exec(); } catch (Exception ignored) {}
            }
        }
    }

    // Creates an in-memory tar archive containing the code file
    private byte[] createTar(String fileName, String code) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (TarArchiveOutputStream tar = new TarArchiveOutputStream(baos)) {
            byte[] codeBytes = code.getBytes(StandardCharsets.UTF_8);
            TarArchiveEntry entry = new TarArchiveEntry(fileName);
            entry.setSize(codeBytes.length);
            entry.setMode(0755);
            tar.putArchiveEntry(entry);
            tar.write(codeBytes);
            tar.closeArchiveEntry();
        }
        return baos.toByteArray();
    }

    private String[] buildRunCommand(String language, String fileName, String input) {
        String sanitizedInput = input.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
        return switch (language.toLowerCase()) {
            case "python"     -> new String[]{"sh", "-c", "echo \"" + sanitizedInput + "\" | python3 " + fileName};
            case "javascript" -> new String[]{"sh", "-c", "echo \"" + sanitizedInput + "\" | node " + fileName};
            case "java"       -> new String[]{"sh", "-c",
                    "javac " + fileName + " && echo \"" + sanitizedInput + "\" | java " + fileName.replace(".java", "")};
            case "cpp"        -> new String[]{"sh", "-c",
                    "g++ -O2 -o solution " + fileName + " && echo \"" + sanitizedInput + "\" | ./solution"};
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }

    private String getImage(String language) {
        return switch (language.toLowerCase()) {
            case "java"       -> "eclipse-temurin:21-jre";
            case "python"     -> "python:3.11-slim";
            case "javascript" -> "node:20-slim";
            case "cpp"        -> "gcc:13";
            default -> throw new IllegalArgumentException("Unsupported language: " + language);
        };
    }

    private String getFileName(String language) {
        return switch (language.toLowerCase()) {
            case "java"       -> "Solution.java";
            case "python"     -> "solution.py";
            case "javascript" -> "solution.js";
            case "cpp"        -> "solution.cpp";
            default           -> "solution.txt";
        };
    }

    private String maskInput(String input) {
        return input != null && input.length() > 100 ? input.substring(0, 100) + "..." : input;
    }

    private DockerClient buildDockerClient() {
        var config = DefaultDockerClientConfig.createDefaultConfigBuilder().build();
        var httpClient = new ApacheDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .connectionTimeout(Duration.ofSeconds(30))
                .responseTimeout(Duration.ofSeconds(60))
                .build();
        return DockerClientImpl.getInstance(config, httpClient);
    }
}