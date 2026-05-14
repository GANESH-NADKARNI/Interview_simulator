package com.interview.service;

import com.interview.model.Session;
import com.interview.repository.SessionRepository;
import com.interviewsim.repository.UserRepository;  // ← use the ONE real UserRepository
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    public Session createSession(String userId, String type) {
        Session session = new Session();
        session.setUserId(userId);
        session.setType(type);
        return sessionRepository.save(session);
    }

    public Session getSession(String sessionId) {
        return sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    public Session saveSession(Session session) {
        return sessionRepository.save(session);
    }

    public Session completeSession(String sessionId, int score, String feedback, String remarks) {
        Session session = getSession(sessionId);
        session.setCompleted(true);
        session.setTotalScore(score);
        session.setOverallFeedback(feedback);
        session.setOverallRemarks(remarks);
        session.setCompletedAt(LocalDateTime.now());
        session = sessionRepository.save(session);

        // NOTE: com.interviewsim.model.entity.User has no SessionSummary/sessionHistory.
        // If you need to track session history on the user, add those fields to
        // com.interviewsim.model.entity.User. Skipping for now to unblock startup.

        return session;
    }

    public List<Session> getUserSessions(String userId) {
        return sessionRepository.findByUserIdOrderByStartedAtDesc(userId);
    }

    public List<Session> getUserSessionsByType(String userId, String type) {
        return sessionRepository.findByUserIdAndTypeOrderByStartedAtDesc(userId, type);
    }
}