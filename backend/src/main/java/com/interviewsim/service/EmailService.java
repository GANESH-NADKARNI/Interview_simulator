package com.interviewsim.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.List;

@Slf4j
@Service
public class EmailService {

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${brevo.from.email}")
    private String fromEmail;

    @Value("${brevo.from.name:InterviewAI}")
    private String fromName;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    public void sendOtp(String toEmail, String otp, String purpose) {
        String subject = switch (purpose) {
            case "VERIFY_EMAIL" -> "Verify your InterviewAI account";
            case "RESET_PASSWORD" -> "Reset your InterviewAI password";
            default -> "InterviewAI OTP";
        };
        String html = buildOtpEmail(otp, purpose);
        sendEmail(toEmail, subject, html);
    }

    public void sendUsernameEmail(String toEmail, String username) {
        sendEmail(toEmail, "Your InterviewAI Username", buildUsernameEmail(username));
    }

    private void sendEmail(String to, String subject, String html) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            Map<String, Object> body = Map.of(
                "sender", Map.of("name", fromName, "email", fromEmail),
                "to", List.of(Map.of("email", to)),
                "subject", subject,
                "htmlContent", html
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_URL, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent to {}", to);
            } else {
                log.error("Failed to send email: {}", response.getBody());
                throw new RuntimeException("Failed to send email");
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    private String buildOtpEmail(String otp, String purpose) {
        String title = switch (purpose) {
            case "VERIFY_EMAIL" -> "Verify Your Email";
            case "RESET_PASSWORD" -> "Reset Your Password";
            default -> "Your OTP Code";
        };
        String message = switch (purpose) {
            case "VERIFY_EMAIL" -> "Use this OTP to verify your email and activate your InterviewAI account.";
            case "RESET_PASSWORD" -> "Use this OTP to reset your password. If you didn't request this, ignore this email.";
            default -> "Use this OTP code.";
        };

        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family:Arial,sans-serif;background:#0f172a;margin:0;padding:40px 20px;">
              <div style="max-width:480px;margin:0 auto;background:#1e293b;border-radius:16px;padding:40px;border:1px solid #334155;">
                <div style="text-align:center;margin-bottom:32px;">
                  <h1 style="color:#f1f5f9;font-size:24px;margin:0 0 8px;">%s</h1>
                  <p style="color:#94a3b8;font-size:14px;margin:0;">%s</p>
                </div>
                <div style="background:#0f172a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;border:1px solid #334155;">
                  <p style="color:#64748b;font-size:12px;margin:0 0 12px;text-transform:uppercase;letter-spacing:2px;">Your OTP Code</p>
                  <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#00d4ff;font-family:monospace;">%s</div>
                  <p style="color:#64748b;font-size:12px;margin:12px 0 0;">Valid for 10 minutes</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(title, message, otp);
    }

    private String buildUsernameEmail(String username) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family:Arial,sans-serif;background:#0f172a;margin:0;padding:40px 20px;">
              <div style="max-width:480px;margin:0 auto;background:#1e293b;border-radius:16px;padding:40px;border:1px solid #334155;">
                <div style="text-align:center;margin-bottom:32px;">
                  <h1 style="color:#f1f5f9;font-size:24px;margin:0 0 8px;">Your Username</h1>
                </div>
                <div style="background:#0f172a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;border:1px solid #334155;">
                  <div style="font-size:28px;font-weight:800;color:#00d4ff;font-family:monospace;">%s</div>
                </div>
              </div>
            </body>
            </html>
            """.formatted(username);
    }
}