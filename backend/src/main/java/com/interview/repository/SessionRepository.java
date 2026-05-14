package com.interview.repository;

import com.interview.model.Session;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SessionRepository extends MongoRepository<Session, String> {
    List<Session> findByUserIdOrderByStartedAtDesc(String userId);
    List<Session> findByUserIdAndTypeOrderByStartedAtDesc(String userId, String type);
    List<Session> findByUserIdAndCompletedTrue(String userId);
}
