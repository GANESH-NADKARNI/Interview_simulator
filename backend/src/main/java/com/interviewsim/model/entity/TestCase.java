package com.interviewsim.model.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "test_cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestCase {

    @Id
    private String id;

    /** References Problem.id */
    @Indexed
    private String problemId;

    private String input;

    private String expectedOutput;

    @Builder.Default
    private Boolean isHidden = false;

    @Builder.Default
    private Integer orderIndex = 0;
}