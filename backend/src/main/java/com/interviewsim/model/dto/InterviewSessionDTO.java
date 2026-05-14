package com.interviewsim.model.dto;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewSessionDTO {
    private Long id;
    @NotBlank private String title;
    @NotNull @Min(10) @Max(180) private Integer durationMins;
    private String status;
    private List<Long> problemIds;
    private String startedAt;
    private String endedAt;
    private Integer totalScore;
    private String notes;
}
