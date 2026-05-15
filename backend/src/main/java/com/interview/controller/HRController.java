package com.interview.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.model.Session;
import com.interview.repository.UserProfileRepository;
import com.interview.service.HRService;
import com.interview.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
public class HRController {

    private final HRService hrService;
    private final SessionService sessionService;
    private final UserProfileRepository profileRepository;
    private final ObjectMapper objectMapper;

    @PostMapping("/start")
    public ResponseEntity<?> startSession(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String username = userDetails.getUsername();
            Session session = sessionService.createSession(username, "HR");
            String expertiseContext = profileRepository.findByUserId(username)
                .map(p -> p.toAIContext()).orElse(null);
            JsonNode questions = hrService.generateQuestions(expertiseContext);
            return ResponseEntity.ok(Map.of("sessionId", session.getId(), "questions", questions));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeAnswer(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody Map<String, Object> body
    ) {
        try {
            String questionJson = body.get("question").toString();
            String transcript = (String) body.get("transcript");
            String duration = (String) body.getOrDefault("duration", "0");
            JsonNode result = hrService.analyzeAnswer(questionJson, transcript, duration);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/complete")
    public ResponseEntity<?> completeSession(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody Map<String, Object> body
    ) {
        try {
            String sessionId = (String) body.get("sessionId");

            @SuppressWarnings("unchecked")
            List<Object> rawAnalyses = (List<Object>) body.get("analyses");
            List<JsonNode> analysisNodes = rawAnalyses.stream()
                .map(a -> (JsonNode) objectMapper.valueToTree(a))
                .toList();

            Object rawExpr = body.get("expressionSummary");
            JsonNode expressionSummary = rawExpr != null ? objectMapper.valueToTree(rawExpr) : null;

            JsonNode finalReport = hrService.generateFinalReport(analysisNodes, expressionSummary);
            int score = finalReport.path("overallScore").asInt(0);
            String summary = finalReport.path("executiveSummary").asText("");
            sessionService.completeSession(sessionId, score, finalReport.toString(), summary);
            return ResponseEntity.ok(finalReport);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}