package com.interviewsim.model.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "otp_tokens")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OtpToken {

    @Id
    private String id;

    @Indexed
    private String email;

    private String otp;

    private OtpType type; // VERIFY_EMAIL, RESET_PASSWORD, FORGOT_USERNAME

    private boolean used = false;

    // Stored as plain timestamp — NOT indexed for TTL (createdAt is just metadata)
    private Instant createdAt;

    // TTL index: MongoDB deletes the document when the current time passes this field.
    // expireAfterSeconds = 0 means "delete as soon as expiresAt is reached".
    // MUST be Instant (BSON Date) — LocalDateTime does NOT work with MongoDB TTL.
    @Indexed(expireAfterSeconds = 0)
    private Instant expiresAt;

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public enum OtpType {
        VERIFY_EMAIL, RESET_PASSWORD, FORGOT_USERNAME
    }
}