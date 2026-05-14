package com.interviewsim.repository;

import com.interviewsim.model.entity.TestCase;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TestCaseRepository extends MongoRepository<TestCase, String> {
    List<TestCase> findByProblemIdOrderByOrderIndexAsc(String problemId);
    List<TestCase> findByProblemIdAndIsHiddenFalseOrderByOrderIndexAsc(String problemId);
}