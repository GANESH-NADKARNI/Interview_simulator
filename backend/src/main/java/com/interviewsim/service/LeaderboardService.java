package com.interviewsim.service;

import com.interviewsim.model.dto.LeaderboardEntry;
import com.interviewsim.model.entity.Submission;
import com.interviewsim.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final SubmissionRepository submissionRepository;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public List<LeaderboardEntry> getForProblem(String problemId) {
        List<Submission> top = submissionRepository.findTopForLeaderboard(
                problemId, PageRequest.of(0, 20));
        AtomicInteger rank = new AtomicInteger(1);
        return top.stream().map(s -> LeaderboardEntry.builder()
                .rank(rank.getAndIncrement())
                .username(s.getUsername())          // denormalized field on Submission
                .aiScore(s.getAiScore())
                .runtimeMs(s.getRuntimeMs())
                .language(s.getLanguage())
                .submittedAt(s.getSubmittedAt() != null ? s.getSubmittedAt().format(FMT) : null)
                .build()
        ).toList();
    }
}