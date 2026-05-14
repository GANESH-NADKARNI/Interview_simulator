package com.interview.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_profiles")
public class UserProfile {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    // Expertise settings
    private String domain;          // e.g., "Backend Development", "Data Science"
    private String subDomain;       // e.g., "Spring Boot & Java", "Python & ML"
    private String experienceLevel; // FRESHER, JUNIOR, MID, SENIOR, LEAD
    private List<String> skills;    // ["Java", "Spring Boot", "MongoDB"]
    private String targetRole;      // "Backend Engineer at Product Startup"
    private String preferredLanguage; // for coding: "python", "java" etc.

    private LocalDateTime updatedAt = LocalDateTime.now();

    // Computed context string for AI prompts
    public String toAIContext() {
        return String.format(
            "Candidate Domain: %s | Specialization: %s | Level: %s | Skills: %s | Target: %s",
            domain != null ? domain : "General",
            subDomain != null ? subDomain : "Not specified",
            experienceLevel != null ? experienceLevel : "Not specified",
            skills != null ? String.join(", ", skills) : "Not specified",
            targetRole != null ? targetRole : "Software Engineer"
        );
    }
}
