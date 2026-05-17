package com.interviewsim.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewsim.service.CodeExecutionService.ExecutionResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class AIEvaluationService {

    private final List<String> apiKeys;
    private final AtomicInteger currentKeyIndex = new AtomicInteger(0);
    private final String model;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AIEvaluationService(
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
        log.info("AIEvaluationService initialized with {} API key(s)", this.apiKeys.size());
    }

    public Map<String, Object> evaluate(String code, String language,
                                         String problemTitle, ExecutionResult result) {
        try {
            return evaluateWithRetry(code, language, problemTitle, result, apiKeys.size());
        } catch (Exception e) {
            log.error("AI evaluation failed: {}", e.getMessage());
            return buildFallbackFeedback(result);
        }
    }

    private Map<String, Object> evaluateWithRetry(String code, String language,
                                                    String problemTitle, ExecutionResult result,
                                                    int attemptsLeft) throws Exception {
        if (attemptsLeft <= 0) {
            throw new RuntimeException("All Groq API keys are rate limited. Please try again later.");
        }

        String key = getCurrentKey();
        try {
            return callGroq(key, code, language, problemTitle, result);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 429) {
                log.warn("Groq key #{} rate limited (429). Rotating to next key. ({} attempts left)",
                    currentKeyIndex.get(), attemptsLeft - 1);
                rotateKey();
                return evaluateWithRetry(code, language, problemTitle, result, attemptsLeft - 1);
            }
            throw e;
        }
    }

    private Map<String, Object> callGroq(String apiKey, String code, String language,
                                          String problemTitle, ExecutionResult result) throws Exception {
        String prompt = buildPrompt(code, language, problemTitle, result);
        String url = "https://api.groq.com/openai/v1/chat/completions";

        Map<String, Object> message = Map.of("role", "user", "content", prompt);
        Map<String, Object> body = Map.of(
            "model", model,
            "messages", List.of(message),
            "temperature", 0.3
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        ResponseEntity<Map> response = restTemplate.exchange(
            url, HttpMethod.POST,
            new HttpEntity<>(body, headers),
            Map.class
        );

        String text = extractContent(response.getBody());
        text = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
        return objectMapper.readValue(text, new TypeReference<Map<String, Object>>() {});
    }

    private String getCurrentKey() {
        return apiKeys.get(currentKeyIndex.get() % apiKeys.size());
    }

    private void rotateKey() {
        int next = (currentKeyIndex.get() + 1) % apiKeys.size();
        currentKeyIndex.set(next);
        log.info("Rotated to Groq API key #{}", next);
    }

    private String buildPrompt(String code, String lang, String problemTitle, ExecutionResult result) {
        return String.format("""
            You are a senior software engineer conducting a technical interview. Analyze the submitted code solution.

            Problem: %s
            Language: %s
            Tests Passed: %d/%d

            Code:
```%s
            %s
```

            Respond ONLY with a valid JSON object (no markdown, no preamble):
            {
              "score": <integer 0-100>,
              "timeComplexity": "<Big-O notation>",
              "spaceComplexity": "<Big-O notation>",
              "qualityScore": <integer 0-10>,
              "readabilityScore": <integer 0-10>,
              "strengths": ["<strength 1>", "<strength 2>"],
              "optimizations": ["<suggestion 1>", "<suggestion 2>"],
              "summary": "<2-3 sentence overall assessment>"
            }
            """,
                problemTitle, lang,
                result.testsPassed(), result.testsTotal(),
                lang, code
        );
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<?, ?> body) {
        try {
            List<?> choices = (List<?>) body.get("choices");
            Map<?, ?> choice = (Map<?, ?>) choices.get(0);
            Map<?, ?> message = (Map<?, ?>) choice.get("message");
            return (String) message.get("content");
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract Groq response: " + e.getMessage());
        }
    }

    private Map<String, Object> buildFallbackFeedback(ExecutionResult result) {
        double ratio = result.testsTotal() > 0
                ? (double) result.testsPassed() / result.testsTotal()
                : 0;
        int score = (int) (ratio * 70);

        Map<String, Object> feedback = new LinkedHashMap<>();
        feedback.put("score", score);
        feedback.put("timeComplexity", "N/A");
        feedback.put("spaceComplexity", "N/A");
        feedback.put("qualityScore", 5);
        feedback.put("readabilityScore", 5);
        feedback.put("strengths", List.of("Solution submitted successfully"));
        feedback.put("optimizations", List.of("AI analysis temporarily unavailable"));
        feedback.put("summary", "Passed " + result.testsPassed() + "/" + result.testsTotal() + " test cases.");
        return feedback;
    }
}