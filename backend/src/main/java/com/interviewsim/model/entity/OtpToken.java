package com.interviewsim.model.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

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

    @Indexed(expireAfterSeconds = 600) // auto-delete after 10 minutes
    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public enum OtpType {
        VERIFY_EMAIL, RESET_PASSWORD, FORGOT_USERNAME
    }
}