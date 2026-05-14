package com.interviewsim.model.entity;

import com.interviewsim.model.enums.Difficulty;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "problems")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Problem {

    @Id
    private String id;

    private String title;

    @Indexed(unique = true)
    private String slug;

    private String description;

    private Difficulty difficulty;

    private String category;

    private String constraints;

    private String examples;

    private String starterCode;

    @Builder.Default
    private Integer timeLimit = 5000;

    @Builder.Default
    private Integer memoryLimit = 256;

    /** Stores the User.id of the creator — no join needed in MongoDB. */
    private String createdById;

    @CreatedDate
    private LocalDateTime createdAt;
}