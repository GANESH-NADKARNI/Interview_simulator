package com.interviewsim.model.dto;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserDTO {
    private String id;
    private String username;
    private String email;
    private String role;
    private String createdAt;
}