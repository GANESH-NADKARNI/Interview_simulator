package com.interviewsim.repository;

import com.interviewsim.model.entity.Problem;
import com.interviewsim.model.enums.Difficulty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ProblemRepository extends MongoRepository<Problem, String> {
    Optional<Problem> findBySlug(String slug);
    Page<Problem> findByDifficulty(Difficulty difficulty, Pageable pageable);
    Page<Problem> findByCategory(String category, Pageable pageable);
    Page<Problem> findByDifficultyAndCategory(Difficulty difficulty, String category, Pageable pageable);
    boolean existsBySlug(String slug);
}