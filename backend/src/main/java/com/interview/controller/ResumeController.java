package com.interview.controller;

import com.interview.service.ResumeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeResume(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestParam("file") MultipartFile file
    ) {
        try {
            String resumeText = extractText(file);
            if (resumeText.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error",
                    "Could not extract text from file. Make sure it's a text-based PDF or TXT."));
            }
            var result = resumeService.analyzeResume(resumeText);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Resume analysis error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/improve")
    public ResponseEntity<?> improveResume(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestParam("file") MultipartFile file,
        @RequestParam(defaultValue = "Software Engineer") String targetRole,
        @RequestParam(defaultValue = "Mid-Level") String targetLevel
    ) {
        try {
            String resumeText = extractText(file);
            var result = resumeService.getResumeImprovement(resumeText, targetRole, targetLevel);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/analyze-text")
    public ResponseEntity<?> analyzeResumeText(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody Map<String, String> body
    ) {
        try {
            String text = body.get("text");
            var result = resumeService.analyzeResume(text);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private String extractText(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() != null
            ? file.getOriginalFilename().toLowerCase() : "";

        if (filename.endsWith(".pdf")) {
            return extractPdfText(file.getInputStream());
        } else if (filename.endsWith(".txt") || filename.endsWith(".md")) {
            return new String(file.getBytes());
        } else if (filename.endsWith(".docx")) {
            return extractDocxText(file.getInputStream());
        } else {
            return new String(file.getBytes());
        }
    }

    private String extractPdfText(InputStream is) throws Exception {
        byte[] bytes = is.readAllBytes();
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    private String extractDocxText(InputStream is) throws Exception {
        String content = new String(is.readAllBytes());
        StringBuilder sb = new StringBuilder();
        boolean inTag = false;
        boolean inText = false;
        StringBuilder tagName = new StringBuilder();

        for (int i = 0; i < content.length(); i++) {
            char c = content.charAt(i);
            if (c == '<') {
                inTag = true;
                tagName = new StringBuilder();
            } else if (c == '>') {
                inTag = false;
                String tag = tagName.toString().trim();
                inText = tag.equals("w:t") || tag.startsWith("w:t ");
                if (tag.equals("/w:p")) sb.append("\n");
                if (tag.equals("/w:tr")) sb.append("\n");
            } else if (inTag) {
                tagName.append(c);
            } else if (inText) {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}