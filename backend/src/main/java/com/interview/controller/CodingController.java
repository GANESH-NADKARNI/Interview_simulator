package com.interview.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.interview.model.Session;
import com.interview.repository.UserProfileRepository;
import com.interview.service.CodingService;
import com.interview.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/coding")
@RequiredArgsConstructor
public class CodingController {

    private final CodingService codingService;
    private final SessionService sessionService;
    private final UserProfileRepository profileRepository;

    @PostMapping("/start")
    public ResponseEntity<?> startSession(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String username = userDetails.getUsername();
            Session session = sessionService.createSession(username, "CODING");
            String expertiseContext = profileRepository.findByUserId(username)
                .map(p -> p.toAIContext()).orElse(null);
            JsonNode problems = codingService.generateProblems(expertiseContext);
            return ResponseEntity.ok(Map.of(
                "sessionId", session.getId(),
                "problems", problems
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/evaluate")
    public ResponseEntity<?> evaluate(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody Map<String, Object> body
    ) {
        try {
            String problemJson = body.get("problem").toString();
            String userCode = (String) body.get("code");
            String language = (String) body.getOrDefault("language", "python");
            JsonNode result = codingService.evaluateSolution(problemJson, userCode, language);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/hint")
    public ResponseEntity<?> getHint(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody Map<String, Object> body
    ) {
        try {
            String problemJson = body.get("problem").toString();
            String userCode = (String) body.getOrDefault("code", "");
            String language = (String) body.getOrDefault("language", "python");
            int hintLevel = ((Number) body.getOrDefault("hintLevel", 1)).intValue();
            JsonNode result = codingService.getHint(problemJson, userCode, language, hintLevel);
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
            int score = ((Number) body.getOrDefault("score", 0)).intValue();
            String feedback = (String) body.getOrDefault("feedback", "");
            sessionService.completeSession(sessionId, score, feedback, "Coding session completed");
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}