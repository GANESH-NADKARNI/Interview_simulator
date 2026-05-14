package com.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.model}")
    private String model;

    @Value("${groq.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public String chat(String systemPrompt, String userMessage) {
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", model);
            body.put("temperature", 0.7);
            body.put("max_tokens", 2048);

            ArrayNode messages = body.putArray("messages");

            ObjectNode sysMsg = messages.addObject();
            sysMsg.put("role", "system");
            sysMsg.put("content", systemPrompt);

            ObjectNode userMsg = messages.addObject();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(body), headers);

            ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, String.class);

            JsonNode responseNode = mapper.readTree(response.getBody());
            return responseNode.path("choices").get(0).path("message").path("content").asText();

        } catch (Exception e) {
            log.error("Groq API error: {}", e.getMessage(), e);
            throw new RuntimeException("AI service error: " + e.getMessage());
        }
    }

    public String chatJson(String systemPrompt, String userMessage) {
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", model);
            body.put("temperature", 0.7);
            body.put("max_tokens", 2048);

            ObjectNode responseFormat = body.putObject("response_format");
            responseFormat.put("type", "json_object");

            ArrayNode messages = body.putArray("messages");

            ObjectNode sysMsg = messages.addObject();
            sysMsg.put("role", "system");
            sysMsg.put("content", systemPrompt + "\n\nYou MUST respond with valid JSON only.");

            ObjectNode userMsg = messages.addObject();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(body), headers);

            ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, String.class);

            JsonNode responseNode = mapper.readTree(response.getBody());
            return responseNode.path("choices").get(0).path("message").path("content").asText();

        } catch (Exception e) {
            log.error("Groq API JSON error: {}", e.getMessage(), e);
            throw new RuntimeException("AI service error: " + e.getMessage());
        }
    }
}
