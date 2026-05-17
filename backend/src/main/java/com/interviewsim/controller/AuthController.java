package com.interviewsim.controller;

import com.interviewsim.model.dto.*;
import com.interviewsim.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController("interviewsimAuthController")
@org.springframework.context.annotation.Primary
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ── Register (step 1 — sends OTP) ────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.ok(Map.of(
            "message", "OTP sent to " + req.getEmail(),
            "email", req.getEmail()
        ));
    }

    // ── Verify email OTP (step 2 — returns JWT) ───────────────────────────────
    @PostMapping("/verify-email")
    public ResponseEntity<LoginResponse> verifyEmail(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.verifyEmail(
            body.get("email"), body.get("otp")
        ));
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    // ── Forgot password (sends OTP) ───────────────────────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        authService.forgotPassword(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "OTP sent to your email"));
    }

    // ── Verify reset OTP ──────────────────────────────────────────────────────
    @PostMapping("/verify-reset-otp")
    public ResponseEntity<?> verifyResetOtp(@RequestBody Map<String, String> body) {
        authService.verifyResetOtp(body.get("email"), body.get("otp"));
        return ResponseEntity.ok(Map.of("message", "OTP verified"));
    }

    // ── Reset password ────────────────────────────────────────────────────────
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        authService.resetPassword(
            body.get("email"),
            body.get("otp"),
            body.get("newPassword")
        );
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    // ── Forgot username ───────────────────────────────────────────────────────
    @PostMapping("/forgot-username")
    public ResponseEntity<?> forgotUsername(@RequestBody Map<String, String> body) {
        authService.forgotUsername(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "Username sent to your email"));
    }

    // ── Resend OTP ────────────────────────────────────────────────────────────
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> body) {
        authService.resendOtp(body.get("email"), body.get("type"));
        return ResponseEntity.ok(Map.of("message", "OTP resent"));
    }

    // ── Change username ───────────────────────────────────────────────────────
    @PutMapping("/change-username")
    public ResponseEntity<LoginResponse> changeUsername(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        return ResponseEntity.ok(
            authService.changeUsername(auth.getName(), body.get("newUsername"))
        );
    }

    // ── Current user ──────────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<UserDTO> me(Authentication auth) {
        return ResponseEntity.ok(authService.getCurrentUser(auth.getName()));
    }
}