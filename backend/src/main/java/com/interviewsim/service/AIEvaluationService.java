package com.interviewsim.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewsim.service.CodeExecutionService.ExecutionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIEvaluationService {

    @Value("${app.ai.api-key}")
    private String apiKey;

    @Value("${app.ai.model}")
    private String model;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public Map<String, Object> evaluate(String code, String language,
                                         String problemTitle, ExecutionResult result) {
        try {
            String prompt = buildPrompt(code, language, problemTitle, result);

            // Groq uses OpenAI-compatible chat completions endpoint
            String url = "https://api.groq.com/openai/v1/chat/completions";

            Map<String, Object> message = Map.of(
                "role", "user",
                "content", prompt
            );
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

        } catch (Exception e) {
            log.error("AI evaluation failed: {}", e.getMessage());
            return buildFallbackFeedback(result);
        }
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
            // Groq/OpenAI response: body.choices[0].message.content
            List<?> choices = (List<?>) body.get("choices");
            Map<?, ?> choice  = (Map<?, ?>) choices.get(0);
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