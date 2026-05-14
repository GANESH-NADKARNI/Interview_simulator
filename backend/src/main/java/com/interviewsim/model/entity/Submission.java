package com.interviewsim.model.entity;

import com.interviewsim.model.enums.SubmissionStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {

    @Id
    private String id;

    /** References User.id */
    @Indexed
    private String userId;

    /**
     * Denormalized username so we can query by username without a join.
     * Keep in sync when username changes (or treat username as immutable).
     */
    @Indexed
    private String username;

    /** References Problem.id */
    @Indexed
    private String problemId;

    /** References InterviewSession.id (nullable) */
    private String sessionId;

    private String language;

    private String code;

    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.PENDING;

    private Integer runtimeMs;

    private Float memoryMb;

    @Builder.Default
    private Integer testsPassed = 0;

    @Builder.Default
    private Integer testsTotal = 0;

    private Integer aiScore;

    /** Stored natively as a nested document in MongoDB — no special type needed. */
    private Map<String, Object> aiFeedback;

    private String errorMessage;

    @CreatedDate
    private LocalDateTime submittedAt;
}