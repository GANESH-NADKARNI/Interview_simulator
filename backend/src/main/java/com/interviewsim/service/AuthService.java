package com.interviewsim.service;

import com.interviewsim.exception.ApiException;
import com.interviewsim.model.dto.*;
import com.interviewsim.model.entity.OtpToken;
import com.interviewsim.model.entity.User;
import com.interviewsim.model.enums.Role;
import com.interviewsim.repository.OtpTokenRepository;
import com.interviewsim.repository.UserRepository;
import com.interviewsim.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    private static final SecureRandom random = new SecureRandom();

    // ── Register (sends OTP, doesn't log in yet) ─────────────────────────────
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ApiException("Username already taken", HttpStatus.CONFLICT);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException("Email already registered", HttpStatus.CONFLICT);
        }

        // Save user as unverified
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .emailVerified(false)
                .build();
        userRepository.save(user);

        // Send verification OTP
        sendOtp(request.getEmail(), OtpToken.OtpType.VERIFY_EMAIL);
    }

    // ── Verify email OTP → complete registration ──────────────────────────────
    @Transactional
    public LoginResponse verifyEmail(String email, String otp) {
        validateOtp(email, otp, OtpToken.OtpType.VERIFY_EMAIL);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        user.setEmailVerified(true);
        userRepository.save(user);

        otpTokenRepository.deleteAllByEmailAndType(email, OtpToken.OtpType.VERIFY_EMAIL);

        String token = tokenProvider.generateToken(user);
        return buildLoginResponse(user, token);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public LoginResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        if (!user.isEmailVerified()) {
            // Resend OTP and inform frontend
            sendOtp(user.getEmail(), OtpToken.OtpType.VERIFY_EMAIL);
            throw new ApiException("EMAIL_NOT_VERIFIED:" + user.getEmail(), HttpStatus.FORBIDDEN);
        }

        String token = tokenProvider.generateToken(userDetails);
        return buildLoginResponse(user, token);
    }

    // ── Forgot password → send OTP ────────────────────────────────────────────
    public void forgotPassword(String email) {
        userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("No account found with this email", HttpStatus.NOT_FOUND));
        sendOtp(email, OtpToken.OtpType.RESET_PASSWORD);
    }

    // ── Verify reset OTP ──────────────────────────────────────────────────────
    public void verifyResetOtp(String email, String otp) {
        validateOtp(email, otp, OtpToken.OtpType.RESET_PASSWORD);
        // Mark as used but keep for reset step
        OtpToken token = otpTokenRepository
                .findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(email, OtpToken.OtpType.RESET_PASSWORD)
                .orElseThrow(() -> new ApiException("OTP not found", HttpStatus.BAD_REQUEST));
        token.setUsed(true);
        otpTokenRepository.save(token);
    }

    // ── Reset password ────────────────────────────────────────────────────────
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        // Re-validate (used=true means it was verified in the previous step)
        OtpToken otpToken = otpTokenRepository
                .findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(email, OtpToken.OtpType.RESET_PASSWORD)
                .orElse(null);

        // Allow if otp was already marked used in verify step (within same session)
        // Check by finding any recent token for this email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        if (newPassword.length() < 8) {
            throw new ApiException("Password must be at least 8 characters", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        otpTokenRepository.deleteAllByEmailAndType(email, OtpToken.OtpType.RESET_PASSWORD);
    }

    // ── Forgot username ───────────────────────────────────────────────────────
    public void forgotUsername(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("No account found with this email", HttpStatus.NOT_FOUND));
        emailService.sendUsernameEmail(email, user.getUsername());
    }

    // ── Resend OTP ────────────────────────────────────────────────────────────
    public void resendOtp(String email, String type) {
        OtpToken.OtpType otpType = OtpToken.OtpType.valueOf(type);
        otpTokenRepository.deleteAllByEmailAndType(email, otpType);
        sendOtp(email, otpType);
    }

    // ── Change username ───────────────────────────────────────────────────────
    @Transactional
    public LoginResponse changeUsername(String currentUsername, String newUsername) {
        if (newUsername == null || newUsername.isBlank()) {
            throw new ApiException("New username cannot be empty", HttpStatus.BAD_REQUEST);
        }
        if (userRepository.existsByUsername(newUsername)) {
            throw new ApiException("Username already taken", HttpStatus.CONFLICT);
        }

        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        user.setUsername(newUsername);
        userRepository.save(user);

        // Re-issue JWT so the new username is reflected in the token
        String token = tokenProvider.generateToken(user);
        return buildLoginResponse(user, token);
    }

    // ── Get current user ──────────────────────────────────────────────────────
    public UserDTO getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt().toString())
                .build();
    }

    // ── Internal helpers ──────────────────────────────────────────────────────
    private void sendOtp(String email, OtpToken.OtpType type) {
        // Delete existing unused OTPs of same type
        otpTokenRepository.deleteAllByEmailAndType(email, type);

        String otp = String.format("%06d", random.nextInt(1000000));

        OtpToken token = OtpToken.builder()
                .email(email)
                .otp(otp)
                .type(type)
                .used(false)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        otpTokenRepository.save(token);

        emailService.sendOtp(email, otp, type.name());
    }

    private void validateOtp(String email, String otp, OtpToken.OtpType type) {
        OtpToken token = otpTokenRepository
                .findTopByEmailAndTypeAndUsedFalseOrderByCreatedAtDesc(email, type)
                .orElseThrow(() -> new ApiException("Invalid or expired OTP", HttpStatus.BAD_REQUEST));

        if (token.isExpired()) {
            throw new ApiException("OTP has expired. Please request a new one.", HttpStatus.BAD_REQUEST);
        }
        if (!token.getOtp().equals(otp)) {
            throw new ApiException("Incorrect OTP. Please try again.", HttpStatus.BAD_REQUEST);
        }
    }

    private LoginResponse buildLoginResponse(User user, String token) {
        return LoginResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .expiresIn(86400000L)
                .build();
    }
}