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

    // Time tracking
    private long timeTakenSeconds = 0; // total time taken to complete
    private String timeTakenFormatted = ""; // e.g. "4m 32s"

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionAnswer {
        private int questionIndex;
        private String question;
        private String questionData;
        private String userAnswer;
        private String aiFeedback;
        private int score;
        private long timeSpentSeconds; // time on this specific question
        private List<String> improvements = new ArrayList<>();
        private String hint;
        private String bestApproach;
    }
}