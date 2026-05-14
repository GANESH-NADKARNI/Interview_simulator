package com.interviewsim.controller;

import com.interviewsim.model.dto.LeaderboardEntry;
import com.interviewsim.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {
    private final LeaderboardService leaderboardService;

    @GetMapping("/problem/{problemId}")
    public ResponseEntity<List<LeaderboardEntry>> forProblem(@PathVariable String problemId) {
        return ResponseEntity.ok(leaderboardService.getForProblem(problemId));
    }
}