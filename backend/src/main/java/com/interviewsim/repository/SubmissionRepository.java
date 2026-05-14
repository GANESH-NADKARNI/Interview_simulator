package com.interviewsim.repository;

import com.interviewsim.model.entity.Submission;
import com.interviewsim.model.enums.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface SubmissionRepository extends MongoRepository<Submission, String> {

    Page<Submission> findByUsernameOrderBySubmittedAtDesc(String username, Pageable pageable);

    List<Submission> findByProblemIdAndStatusOrderByAiScoreDescRuntimeMsAsc(
            String problemId, SubmissionStatus status);

    /**
     * Leaderboard: accepted submissions for a problem, sorted by score desc / runtime asc.
     * Pass a PageRequest with Sort, e.g.:
     *   PageRequest.of(0, 10, Sort.by(Sort.Order.desc("aiScore"), Sort.Order.asc("runtimeMs")))
     */
    @Query("{ 'problemId': ?0, 'status': 'ACCEPTED' }")
    List<Submission> findTopForLeaderboard(String problemId, Pageable pageable);

    long countByUsernameAndStatus(String username, SubmissionStatus status);
}