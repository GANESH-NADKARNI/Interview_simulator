package com.interview.repository;

import com.interview.model.UserProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserProfileRepository extends MongoRepository<UserProfile, String> {
    Optional<UserProfile> findByUserId(String userId);
}
