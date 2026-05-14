package com.interview.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.interview.model.Session;
import com.interview.repository.UserProfileRepository;
import com.interview.service.AptitudeService;
import com.interview.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/aptitude")
@RequiredArgsConstructor
public class AptitudeController {

    private final AptitudeService aptitudeService;
    private final SessionService sessionService;
    private final UserProfileRepository profileRepository;

    @PostMapping("/start")
    public ResponseEntity<?> startSession(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            String username = userDetails.getUsername();
            Session session = sessionService.createSession(username, "APTITUDE");
            String expertiseContext = profileRepository.findByUserId(username)
                .map(p -> p.toAIContext()).orElse(null);
            JsonNode questions = aptitudeService.generateQuestions(expertiseContext);
            return ResponseEntity.ok(Map.of(
                "sessionId", session.getId(),
                "questions", questions
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
            String sessionId = (String) body.get("sessionId");
            String questionsJson = body.get("questions").toString();
            String answersJson = body.get("answers").toString();

            JsonNode result = aptitudeService.evaluateAnswers(questionsJson, answersJson);

            int score = result.path("totalScore").asInt(0);
            String remarks = result.path("overallRemarks").asText("");

            sessionService.completeSession(sessionId, score, result.toString(), remarks);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}