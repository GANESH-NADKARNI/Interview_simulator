package com.interviewsim.service;

import com.interviewsim.exception.ApiException;
import com.interviewsim.model.dto.SubmissionRequest;
import com.interviewsim.model.dto.SubmissionResponse;
import com.interviewsim.model.entity.*;
import com.interviewsim.model.enums.SubmissionStatus;
import com.interviewsim.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final InterviewSessionRepository sessionRepository;
    private final TestCaseRepository testCaseRepository;
    private final CodeExecutionService codeExecutionService;
    private final AIEvaluationService aiEvaluationService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Transactional
    public SubmissionResponse submit(SubmissionRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new ApiException("Problem not found", HttpStatus.NOT_FOUND));

        String sessionId = null;
        if (request.getSessionId() != null) {
            sessionId = request.getSessionId();
        }

        // Save initial submission — use denormalized String fields, no entity refs
        Submission submission = Submission.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .problemId(problem.getId())
                .sessionId(sessionId)
                .language(request.getLanguage())
                .code(request.getCode())
                .status(SubmissionStatus.RUNNING)
                .build();
        submission = submissionRepository.save(submission);

        try {
            // Fetch all test cases (including hidden)
            List<TestCase> testCases = testCaseRepository
                    .findByProblemIdOrderByOrderIndexAsc(problem.getId());

            // Execute code in Docker
            log.info("Running code execution for submission {}", submission.getId());
            CodeExecutionService.ExecutionResult execResult =
                    codeExecutionService.execute(request.getCode(), request.getLanguage(), testCases);

            // Determine status
            SubmissionStatus status = determineStatus(execResult);

            // Get AI evaluation
            log.info("Running AI evaluation for submission {}", submission.getId());
            Map<String, Object> aiFeedback = aiEvaluationService.evaluate(
                    request.getCode(), request.getLanguage(),
                    problem.getTitle(), execResult
            );

            int aiScore = aiFeedback.containsKey("score")
                    ? ((Number) aiFeedback.get("score")).intValue()
                    : 0;

            // Update submission
            submission.setStatus(status);
            submission.setTestsPassed(execResult.testsPassed());
            submission.setTestsTotal(execResult.testsTotal());
            submission.setRuntimeMs(execResult.runtimeMs());
            submission.setAiFeedback(aiFeedback);
            submission.setAiScore(aiScore);
            if (execResult.errorMessage() != null) {
                submission.setErrorMessage(execResult.errorMessage());
            }
            submission = submissionRepository.save(submission);

            // Build visible test results (hide hidden test case I/O)
            List<SubmissionResponse.TestCaseResult> visibleResults = execResult.testResults().stream()
                    .map(r -> Boolean.TRUE.equals(r.getHidden())
                            ? SubmissionResponse.TestCaseResult.builder()
                                .input("(hidden)")
                                .expected("(hidden)")
                                .actual(r.getPassed() ? "Correct" : "Wrong")
                                .passed(r.getPassed())
                                .runtimeMs(r.getRuntimeMs())
                                .hidden(true)
                                .build()
                            : r
                    ).toList();

            return toResponse(submission, problem, visibleResults);

        } catch (Exception e) {
            log.error("Submission processing failed", e);
            submission.setStatus(SubmissionStatus.RUNTIME_ERROR);
            submission.setErrorMessage(e.getMessage());
            submissionRepository.save(submission);
            return toResponse(submission, problem, List.of());
        }
    }

    public SubmissionResponse findById(String id) {
        Submission s = submissionRepository.findById(id)
                .orElseThrow(() -> new ApiException("Submission not found", HttpStatus.NOT_FOUND));
        Problem problem = problemRepository.findById(s.getProblemId()).orElse(null);
        return toResponse(s, problem, List.of());
    }

    public Page<SubmissionResponse> getUserHistory(String username, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return submissionRepository
                .findByUsernameOrderBySubmittedAtDesc(username, pageable)
                .map(s -> {
                    Problem problem = problemRepository.findById(s.getProblemId()).orElse(null);
                    return toResponse(s, problem, List.of());
                });
    }

    private SubmissionStatus determineStatus(CodeExecutionService.ExecutionResult result) {
        if (result.errorMessage() != null && result.testsPassed() == 0) {
            return SubmissionStatus.RUNTIME_ERROR;
        }
        if (result.testsPassed() == result.testsTotal()) {
            return SubmissionStatus.ACCEPTED;
        }
        boolean timeLimitHit = result.testResults().stream()
                .anyMatch(r -> "TIME_LIMIT_EXCEEDED".equals(r.getActual()));
        if (timeLimitHit) return SubmissionStatus.TIME_LIMIT_EXCEEDED;
        return SubmissionStatus.WRONG_ANSWER;
    }

    private SubmissionResponse toResponse(Submission s, Problem problem,
                                           List<SubmissionResponse.TestCaseResult> results) {
        return SubmissionResponse.builder()
                .id(s.getId())
                .problemId(s.getProblemId())
                .problemTitle(problem != null ? problem.getTitle() : null)
                .language(s.getLanguage())
                .status(s.getStatus().name())
                .runtimeMs(s.getRuntimeMs())
                .memoryMb(s.getMemoryMb())
                .testsPassed(s.getTestsPassed())
                .testsTotal(s.getTestsTotal())
                .aiScore(s.getAiScore())
                .aiFeedback(s.getAiFeedback())
                .testResults(results)
                .errorMessage(s.getErrorMessage())
                .submittedAt(s.getSubmittedAt() != null ? s.getSubmittedAt().format(FMT) : null)
                .build();
    }
}