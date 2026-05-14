package com.interviewsim.repository;

import com.interviewsim.model.entity.InterviewSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface InterviewSessionRepository extends MongoRepository<InterviewSession, String> {
    Page<InterviewSession> findByUsernameOrderByCreatedAtDesc(String username, Pageable pageable);
}