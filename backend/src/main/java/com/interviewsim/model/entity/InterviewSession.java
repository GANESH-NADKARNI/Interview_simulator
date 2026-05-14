package com.interviewsim.model.entity;

import com.interviewsim.model.enums.SessionStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "interview_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSession {

    @Id
    private String id;

    /** References User.id */
    @Indexed
    private String userId;

    /**
     * Denormalized username for querying without joins.
     * Keep in sync if username can change.
     */
    @Indexed
    private String username;

    private String title;

    @Builder.Default
    private Integer durationMins = 60;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    @Builder.Default
    private SessionStatus status = SessionStatus.SCHEDULED;

    /**
     * List of Problem IDs (String) for this session.
     * Stored natively as a JSON array in MongoDB — no @JdbcTypeCode needed.
     */
    private List<String> problemIds;

    @Builder.Default
    private Integer totalScore = 0;

    private String notes;

    @CreatedDate
    private LocalDateTime createdAt;
}