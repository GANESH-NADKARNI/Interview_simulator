package com.interview.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class TranscriptionService {

    private final List<String> apiKeys;
    private final AtomicInteger currentKeyIndex = new AtomicInteger(0);
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
    private static final String WHISPER_MODEL = "whisper-large-v3-turbo";

    public TranscriptionService(@Value("${app.ai.api-keys}") String apiKeysRaw) {
        this.apiKeys = Arrays.stream(apiKeysRaw.split(","))
            .map(String::trim)
            .filter(k -> !k.isBlank())
            .toList();
        log.info("TranscriptionService initialized with {} API key(s)", this.apiKeys.size());
    }

    public String transcribe(MultipartFile audioFile) throws Exception {
        return transcribeWithRetry(audioFile, apiKeys.size());
    }

    private String transcribeWithRetry(MultipartFile audioFile, int attemptsLeft) throws Exception {
        if (attemptsLeft <= 0) {
            throw new RuntimeException("All Groq API keys are rate limited. Please try again later.");
        }

        String key = getCurrentKey();
        try {
            return callWhisper(key, audioFile);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 429) {
                log.warn("Groq key #{} rate limited (429). Rotating to next key. ({} attempts left)",
                    currentKeyIndex.get(), attemptsLeft - 1);
                rotateKey();
                return transcribeWithRetry(audioFile, attemptsLeft - 1);
            }
            throw e;
        }
    }

    private String callWhisper(String apiKey, MultipartFile audioFile) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(apiKey);

        byte[] audioBytes = audioFile.getBytes();
        ByteArrayResource audioResource = new ByteArrayResource(audioBytes) {
            @Override
            public String getFilename() {
                return "recording.webm";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", audioResource);
        body.add("model", WHISPER_MODEL);
        body.add("language", "en");
        body.add("response_format", "verbose_json");

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map> response = restTemplate.exchange(
            GROQ_WHISPER_URL,
            HttpMethod.POST,
            request,
            Map.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            Object text = response.getBody().get("text");
            if (text != null) {
                return text.toString().trim();
            }
        }
        throw new RuntimeException("Failed to get transcript from Groq Whisper");
    }

    private String getCurrentKey() {
        return apiKeys.get(currentKeyIndex.get() % apiKeys.size());
    }

    private void rotateKey() {
        int next = (currentKeyIndex.get() + 1) % apiKeys.size();
        currentKeyIndex.set(next);
        log.info("Rotated to Groq API key #{}", next);
    }
}