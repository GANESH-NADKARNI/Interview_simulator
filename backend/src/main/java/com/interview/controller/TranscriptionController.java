package com.interview.controller;

import com.interview.service.TranscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
public class TranscriptionController {

    private final TranscriptionService transcriptionService;

    @PostMapping("/transcribe")
    public ResponseEntity<?> transcribe(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestParam("audio") MultipartFile audioFile
    ) {
        try {
            if (audioFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No audio file provided"));
            }
            String transcript = transcriptionService.transcribe(audioFile);
            return ResponseEntity.ok(Map.of("transcript", transcript));
        } catch (Exception e) {
            log.error("Transcription error: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}