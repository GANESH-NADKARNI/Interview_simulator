package com.interviewsim.model.dto;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TestCaseDTO {
    private String id;
    private String input;
    private String expectedOutput;
    private Boolean isHidden;
    private Integer orderIndex;
}