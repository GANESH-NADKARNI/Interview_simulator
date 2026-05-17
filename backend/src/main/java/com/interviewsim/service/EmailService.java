
package com.interviewsim.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtp(String toEmail, String otp, String purpose) {
        String subject = switch (purpose) {
            case "VERIFY_EMAIL" -> "Verify your InterviewAI account";
            case "RESET_PASSWORD" -> "Reset your InterviewAI password";
            case "FORGOT_USERNAME" -> "Your InterviewAI username";
            default -> "InterviewAI OTP";
        };
        String html = buildOtpEmail(otp, purpose, toEmail);
        sendEmail(toEmail, subject, html);
    }

    public void sendUsernameEmail(String toEmail, String username) {
        String html = buildUsernameEmail(username);
        sendEmail(toEmail, "Your InterviewAI Username", html);
    }

    private void sendEmail(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("InterviewAI <" + fromEmail + ">");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    private String buildOtpEmail(String otp, String purpose, String email) {
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
                  <div style="width:56px;height:56px;background:linear-gradient(135deg,#00d4ff,#7c3aed);border-radius:14px;margin:0 auto 16px;">
                    <span style="font-size:24px;">⚡</span>
                  </div>
                  <h1 style="color:#f1f5f9;font-size:24px;margin:0 0 8px;">%s</h1>
                  <p style="color:#94a3b8;font-size:14px;margin:0;">%s</p>
                </div>
                <div style="background:#0f172a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;border:1px solid #334155;">
                  <p style="color:#64748b;font-size:12px;margin:0 0 12px;text-transform:uppercase;letter-spacing:2px;">Your OTP Code</p>
                  <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#00d4ff;font-family:monospace;">%s</div>
                  <p style="color:#64748b;font-size:12px;margin:12px 0 0;">Valid for 10 minutes</p>
                </div>
                <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
                  If you didn't request this, you can safely ignore this email.
                </p>
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
                  <p style="color:#94a3b8;font-size:14px;margin:0;">Here is your InterviewAI username</p>
                </div>
                <div style="background:#0f172a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;border:1px solid #334155;">
                  <p style="color:#64748b;font-size:12px;margin:0 0 12px;text-transform:uppercase;letter-spacing:2px;">Username</p>
                  <div style="font-size:28px;font-weight:800;color:#00d4ff;font-family:monospace;">%s</div>
                </div>
                <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
                  Use this username to log in to InterviewAI.
                </p>
              </div>
            </body>
            </html>
            """.formatted(username);
    }
}