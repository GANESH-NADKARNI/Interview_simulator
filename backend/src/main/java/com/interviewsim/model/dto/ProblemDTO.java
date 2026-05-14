package com.interviewsim.model.dto;
import lombok.*;
import java.util.List;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProblemDTO {
    private String id;
    private String title;
    private String slug;
    private String description;
    private String difficulty;
    private String category;
    private String constraints;
    private String examples;
    private String starterCode;
    private Integer timeLimit;
    private Integer memoryLimit;
    private List<TestCaseDTO> testCases;
}
