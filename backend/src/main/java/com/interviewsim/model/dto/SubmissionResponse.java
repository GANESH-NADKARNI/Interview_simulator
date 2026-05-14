package com.interviewsim.model.dto;
import lombok.*;
import java.util.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SubmissionResponse {
    private String id;
    private String problemId;
    private String problemTitle;
    private String language;
    private String status;
    private Integer runtimeMs;
    private Float memoryMb;
    private Integer testsPassed;
    private Integer testsTotal;
    private Integer aiScore;
    private Map<String, Object> aiFeedback;
    private List<TestCaseResult> testResults;
    private String errorMessage;
    private String submittedAt;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TestCaseResult {
        private String input;
        private String expected;
        private String actual;
        private Boolean passed;
        private Integer runtimeMs;
        private Boolean hidden;
    }
}
