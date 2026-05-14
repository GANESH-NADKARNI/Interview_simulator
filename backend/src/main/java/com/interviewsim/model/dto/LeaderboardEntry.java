package com.interviewsim.model.dto;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LeaderboardEntry {
    private Integer rank;
    private String username;
    private Integer aiScore;
    private Integer runtimeMs;
    private String language;
    private String submittedAt;
}
