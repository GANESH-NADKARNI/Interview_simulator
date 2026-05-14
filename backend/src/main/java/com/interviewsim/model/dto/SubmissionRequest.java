package com.interviewsim.model.dto;
import jakarta.validation.constraints.*;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SubmissionRequest {
    @NotNull private String problemId;
    private String sessionId;
    @NotBlank private String language;
    @NotBlank @Size(max = 50000) private String code;
}
