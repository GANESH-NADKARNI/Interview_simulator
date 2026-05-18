package com.interviewsim.repository;

import com.interviewsim.model.entity.OtpToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OtpTokenRepository extends MongoRepository<OtpToken, String> {
    Optional<OtpToken> findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(
        String email, OtpToken.OtpType type
    );
    // Used by resetPassword to confirm verifyResetOtp was completed in this session
    boolean existsByEmailAndTypeAndUsedTrue(String email, OtpToken.OtpType type);
    void deleteAllByEmail(String email);
    void deleteAllByEmailAndType(String email, OtpToken.OtpType type);
}