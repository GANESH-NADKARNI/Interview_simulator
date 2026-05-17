package com.interview.controller;

import com.interview.model.Session;
import com.interviewsim.repository.UserRepository;
import com.interview.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Session>> getMySessions(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(sessionService.getUserSessions(userDetails.getUsername()));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Session>> getByType(
        @AuthenticationPrincipal UserDetails userDetails,
        @PathVariable String type
    ) {
        return ResponseEntity.ok(sessionService.getUserSessionsByType(userDetails.getUsername(), type.toUpperCase()));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getSession(
        @AuthenticationPrincipal UserDetails userDetails,
        @PathVariable String sessionId
    ) {
        try {
            Session session = sessionService.getSession(sessionId);
            if (!session.getUserId().equals(userDetails.getUsername())) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/me/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
            .map(user -> {
                user.setPassword(null);
                return ResponseEntity.ok(user);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me/stats")
    public ResponseEntity<?> getStats(@AuthenticationPrincipal UserDetails userDetails) {
        List<Session> all = sessionService.getUserSessions(userDetails.getUsername());
        long completed = all.stream().filter(Session::isCompleted).count();
        double avgScore = all.stream().filter(Session::isCompleted)
            .mapToInt(Session::getTotalScore).average().orElse(0);

        long aptitude = all.stream().filter(s -> "APTITUDE".equals(s.getType()) && s.isCompleted()).count();
        long coding   = all.stream().filter(s -> "CODING".equals(s.getType())   && s.isCompleted()).count();
        long hr       = all.stream().filter(s -> "HR".equals(s.getType())       && s.isCompleted()).count();

        // Average time per type
        double avgAptitudeTime = all.stream()
            .filter(s -> "APTITUDE".equals(s.getType()) && s.isCompleted() && s.getTimeTakenSeconds() > 0)
            .mapToLong(Session::getTimeTakenSeconds).average().orElse(0);
        double avgCodingTime = all.stream()
            .filter(s -> "CODING".equals(s.getType()) && s.isCompleted() && s.getTimeTakenSeconds() > 0)
            .mapToLong(Session::getTimeTakenSeconds).average().orElse(0);

        // Score trend (last 10 completed sessions)
        List<Map<String, Object>> scoreTrend = all.stream()
            .filter(Session::isCompleted)
            .sorted((a, b) -> a.getStartedAt().compareTo(b.getStartedAt()))
            .limit(10)
            .map(s -> Map.<String, Object>of(
                "date", s.getStartedAt().toLocalDate().toString(),
                "score", s.getTotalScore(),
                "type", s.getType(),
                "time", s.getTimeTakenSeconds()
            ))
            .toList();

        return ResponseEntity.ok(Map.of(
            "totalSessions", all.size(),
            "completedSessions", completed,
            "averageScore", Math.round(avgScore),
            "aptitudeCount", aptitude,
            "codingCount", coding,
            "hrCount", hr,
            "avgAptitudeTimeSecs", Math.round(avgAptitudeTime),
            "avgCodingTimeSecs", Math.round(avgCodingTime),
            "scoreTrend", scoreTrend
        ));
    }
}