package com.interviewsim.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.interviewsim.model.entity.User;
import com.interviewsim.model.enums.Role;
import com.interviewsim.repository.UserRepository;
import com.interviewsim.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Base64;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class FirebaseAuthController {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    private static final long   MAX_SKEW_WAIT_MS = 60_000; // wait at most 60s for skew
    private static final long   SKEW_BUFFER_MS   = 1_500;  // extra 1.5s safety buffer
    private static final String NOT_YET_VALID    = "not yet valid";

    @PostMapping("/firebase-login")
    public ResponseEntity<?> firebaseLogin(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");

        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "idToken is required"));
        }

        // Handle clock skew: decode the JWT's iat claim and wait precisely
        // until this machine's clock catches up, rather than blind retrying.
        waitForTokenValidity(idToken);

        FirebaseToken decoded = null;
        try {
            log.info("Verifying Firebase ID token...");
            decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
            log.info("Firebase token verified for email: {}", decoded.getEmail());
        } catch (FirebaseAuthException e) {
            log.error("Firebase token verification failed — code: {}, message: {}",
                    e.getErrorCode(), e.getMessage());
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Invalid or expired Firebase token"));
        } catch (Exception e) {
            log.error("Unexpected error in firebase-login", e);
            return ResponseEntity.status(500).body(Map.of("message", "Internal server error"));
        }

        if (decoded == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Invalid or expired Firebase token"));
        }

        try {
            String email          = decoded.getEmail();
            String picture        = decoded.getPicture();
            String signInProvider = extractProvider(decoded);

            User user = userRepository.findByEmail(email).orElseGet(() -> {
                String baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "");
                String username = baseUsername;
                int counter = 1;
                while (userRepository.existsByUsername(username)) {
                    username = baseUsername + counter++;
                }
                log.info("Creating new user: {}", username);
                return User.builder()
                        .email(email)
                        .username(username)
                        .password(null)
                        .emailVerified(true)
                        .provider(signInProvider)
                        .profilePicture(picture)
                        .role(Role.USER)
                        .build();
            });

            if (picture != null && !picture.equals(user.getProfilePicture())) {
                user.setProfilePicture(picture);
            }
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
            }

            userRepository.save(user);
            log.info("User saved: {}", user.getUsername());

            String jwt = jwtTokenProvider.generateToken(user);

            return ResponseEntity.ok(Map.of(
                    "token",    jwt,
                    "username", user.getUsername(),
                    "email",    user.getEmail(),
                    "role",     user.getRole().name()
            ));

        } catch (Exception e) {
            log.error("Unexpected error in firebase-login", e);
            return ResponseEntity.status(500).body(Map.of("message", "Internal server error"));
        }
    }

    /**
     * Decodes the JWT payload to read the {@code iat} (issued-at) claim and
     * sleeps until this machine's clock reaches that timestamp (plus a small
     * buffer). This compensates for local clock-skew without touching system
     * settings or performing blind retries.
     */
    private void waitForTokenValidity(String idToken) {
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) return;

            // JWT payload is base64url-encoded (no padding needed for decode)
            byte[] payloadBytes = Base64.getUrlDecoder().decode(
                    parts[1].replaceAll("=+$", "") // strip any trailing padding
            );
            @SuppressWarnings("unchecked")
            Map<String, Object> claims =
                    new ObjectMapper().readValue(payloadBytes, Map.class);

            Object iat = claims.get("iat");
            if (!(iat instanceof Number)) return;

            long iatMs  = ((Number) iat).longValue() * 1000L;
            long nowMs  = System.currentTimeMillis();
            long waitMs = iatMs - nowMs + SKEW_BUFFER_MS;

            if (waitMs > 0 && waitMs <= MAX_SKEW_WAIT_MS) {
                log.warn("Local clock is {}ms behind token iat — waiting {}ms to compensate clock skew",
                        waitMs - SKEW_BUFFER_MS, waitMs);
                Thread.sleep(waitMs);
            } else if (waitMs > MAX_SKEW_WAIT_MS) {
                log.error("Clock skew of {}ms exceeds maximum tolerated skew of {}ms — " +
                          "please sync your system clock", waitMs - SKEW_BUFFER_MS, MAX_SKEW_WAIT_MS);
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.debug("Could not parse token iat for skew check: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private String extractProvider(FirebaseToken decoded) {
        try {
            Object firebaseClaim = decoded.getClaims().get("firebase");
            if (firebaseClaim instanceof Map<?, ?> firebaseMap) {
                Object sp = firebaseMap.get("sign_in_provider");
                if (sp != null) return sp.toString();
            }
        } catch (Exception ignored) {}
        return "EMAIL";
    }
}