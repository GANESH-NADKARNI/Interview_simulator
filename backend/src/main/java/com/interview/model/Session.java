package com.interview.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "sessions")
public class Session {
    @Id
    private String id;

    private String userId;
    private String type; // APTITUDE, CODING, HR

    private List<QuestionAnswer> questionAnswers = new ArrayList<>();

    private int totalScore;
    private String overallFeedback;
    private String overallRemarks;

    private LocalDateTime startedAt = LocalDateTime.now();
    private LocalDateTime completedAt;
    private boolean completed = false;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionAnswer {
        private int questionIndex;
        private String question;
        private String questionData; // JSON with full question details
        private String userAnswer;
        private String aiFeedback;
        private int score; // out of 10
        private List<String> improvements = new ArrayList<>();
        private String hint;
        private String bestApproach;
    }
}
