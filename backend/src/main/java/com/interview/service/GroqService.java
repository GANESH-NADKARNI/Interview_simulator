package com.interview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class GroqService {

    private final List<String> apiKeys;
    private final AtomicInteger currentKeyIndex = new AtomicInteger(0);
    private final String model;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    public GroqService(
        @Value("${app.ai.api-keys}") String apiKeysRaw,
        @Value("${app.ai.model:llama-3.3-70b-versatile}") String model,
        RestTemplate restTemplate,
        ObjectMapper objectMapper
    ) {
        this.apiKeys = Arrays.stream(apiKeysRaw.split(","))
            .map(String::trim)
            .filter(k -> !k.isBlank())
            .toList();
        this.model = model;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        log.info("GroqService initialized with {} API key(s)", this.apiKeys.size());
    }

    /**
     * Send a chat request. Automatically rotates to the next key on rate limit (429).
     */
    public String chat(String systemPrompt, String userMessage) {
        return chatWithRetry(systemPrompt, userMessage, 1.0, apiKeys.size());
    }

    /**
     * Same as chat() but with temperature=0.1 for JSON responses.
     */
    public String chatJson(String systemPrompt, String userMessage) {
        return chatWithRetry(systemPrompt, userMessage, 0.1, apiKeys.size());
    }

    private String chatWithRetry(String systemPrompt, String userMessage, double temperature, int attemptsLeft) {
        if (attemptsLeft <= 0) {
            throw new RuntimeException("All Groq API keys are rate limited. Please try again later.");
        }

        String key = getCurrentKey();
        try {
            return callGroq(key, systemPrompt, userMessage, temperature);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 429) {
                log.warn("Groq key #{} rate limited (429). Rotating to next key. ({} attempts left)",
                    currentKeyIndex.get(), attemptsLeft - 1);
                rotateKey();
                return chatWithRetry(systemPrompt, userMessage, temperature, attemptsLeft - 1);
            }
            throw e;
        }
    }

    private String callGroq(String apiKey, String systemPrompt, String userMessage, double temperature) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = Map.of(
            "model", model,
            "temperature", temperature,
            "max_tokens", 4096,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user",   "content", userMessage)
            )
        );

        ResponseEntity<Map> response = restTemplate.exchange(
            GROQ_URL, HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );

        @SuppressWarnings("unchecked")
        List<Map<?, ?>> choices = (List<Map<?, ?>>) response.getBody().get("choices");
        Map<?, ?> message = (Map<?, ?>) choices.get(0).get("message");
        String content = (String) message.get("content");

        // Strip markdown fences if present
        return content.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
    }

    private String getCurrentKey() {
        return apiKeys.get(currentKeyIndex.get() % apiKeys.size());
    }

    private void rotateKey() {
        int next = (currentKeyIndex.get() + 1) % apiKeys.size();
        currentKeyIndex.set(next);
        log.info("Rotated to Groq API key #{}", next);
    }

    /**
     * Returns current key usage info for monitoring.
     */
    public Map<String, Object> getKeyStatus() {
        return Map.of(
            "totalKeys", apiKeys.size(),
            "currentKeyIndex", currentKeyIndex.get() % apiKeys.size()
        );
    }
}