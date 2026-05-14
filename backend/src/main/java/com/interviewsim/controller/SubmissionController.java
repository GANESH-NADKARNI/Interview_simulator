package com.interviewsim.controller;

import com.interviewsim.model.dto.SubmissionRequest;
import com.interviewsim.model.dto.SubmissionResponse;
import com.interviewsim.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {
    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<SubmissionResponse> submit(
            @Valid @RequestBody SubmissionRequest request, Authentication auth) {
        return ResponseEntity.ok(submissionService.submit(request, auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubmissionResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(submissionService.findById(id));
    }

    @GetMapping("/user/history")
    public ResponseEntity<Page<SubmissionResponse>> history(
            Authentication auth,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(submissionService.getUserHistory(auth.getName(), page, size));
    }
}