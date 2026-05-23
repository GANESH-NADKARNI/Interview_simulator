package com.interviewsim.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.service-account-json:}")
    private String serviceAccountJson;

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @PostConstruct
    public void initialize() throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            InputStream serviceAccount;

            if (serviceAccountJson != null && !serviceAccountJson.isBlank()) {
                serviceAccount = new ByteArrayInputStream(
                    serviceAccountJson.getBytes(StandardCharsets.UTF_8)
                );
            } else if (credentialsPath != null && !credentialsPath.isBlank()) {
                serviceAccount = new FileInputStream(credentialsPath);
            } else {
                throw new IllegalStateException(
                    "Firebase config missing: set either " +
                    "FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_CREDENTIALS_PATH"
                );
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();
            FirebaseApp.initializeApp(options);
        }

        // Warm up the public key cache so the first real login doesn't fail.
        // verifyIdToken fetches Google's public keys over the network on first call;
        // if that fetch overlaps with the iat window check, Firebase throws
        // "not yet valid". Calling it once at startup pre-fetches the keys.
        log.info("Warming up Firebase public key cache...");
        try {
            FirebaseAuth.getInstance().verifyIdToken("warmup");
        } catch (Exception ignored) {
            // Always throws (invalid token) — that's expected.
            // The side effect we want is the key fetch, which has now happened.
        }
        log.info("Firebase public key cache warmed up.");
    }
}