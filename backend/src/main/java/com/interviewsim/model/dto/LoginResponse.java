package com.interviewsim.model.dto;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginResponse {
    private String token;
    private String username;
    private String email;
    private String role;
    private long expiresIn;
}
