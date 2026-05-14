package com.interviewsim.controller;

import com.interviewsim.model.dto.ProblemDTO;
import com.interviewsim.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {
    private final ProblemService problemService;

    @GetMapping
    public ResponseEntity<Page<ProblemDTO>> getAll(
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(problemService.getAll(difficulty, category, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProblemDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(problemService.getById(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ProblemDTO> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(problemService.getBySlug(slug));
    }
}