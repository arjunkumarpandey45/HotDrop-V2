package com.arjun.hotdrop_backend.service.impl;

import com.arjun.hotdrop_backend.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    @Async
    public void sendVerificationEmail(String toEmail, String name, String verificationLink) {
        log.info("Sending verification email to: {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("hotdrop1229@gmail.com", "HotDrop");
            helper.setTo(toEmail);
            helper.setSubject("Verify your HotDrop Account ");

            String htmlContent = String.format(
                    "<h3>Hey %s, welcome to HotDrop!</h3>" +
                            "<p>Please click the link below to verify your developer profile and activate your account:</p>" +
                            "<a href='%s' style='background-color:#111; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px;'>Verify Account</a>" +
                            "<br/><p>This link is valid for 15 minutes.</p>",
                    name, verificationLink
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Verification email successfully sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    @Async
    public void sendProjectDownAlert(String recipientEmail, String projectTitle, String projectUrl) {
        log.info("Sending project down alert email to: {} for project: '{}'", recipientEmail, projectTitle);
        String subject = "🚨Action Required: Your HotDrop project is DOWN!";
        String content = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px; background-color: #fffaf0;">
                <h2 style="color: #dc2626; margin-top: 0;">⚠️ Project Health Alert</h2>
                <p style="font-size: 14px; color: #374151;">Hey developer,</p>
                <p style="font-size: 14px; color: #374151;">Our automated monitor detected that your project <strong>%s</strong> is unreachable or throwing bad HTTP status codes.</p>
                <div style="background-color: #fef2f2; padding: 12px; border-radius: 8px; font-family: monospace; color: #991b1b; margin: 15px 0;">
                    Target URL: <a href="%s" style="color: #b91c1c;">%s</a>
                </div>
                <p style="font-size: 13px; color: #6b7280;">Please check your hosting deployment (Vercel, Render, Railway, etc.) and logs. We will automatically mark it back to Live once it starts responding!</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 11px; color: #9ca3af;">Sent by HotDrop Autonomous Link Monitoring Engine</p>
            </div>
            """.formatted(projectTitle, projectUrl, projectUrl);

        sendHtmlMail(recipientEmail, subject, content);
    }

    @Async
    public void sendProjectUpAlert(String recipientEmail, String projectTitle, String projectUrl) {
        log.info("Sending project restored alert email to: {} for project: '{}'", recipientEmail, projectTitle);
        String subject = "✅ Resolved: Your HotDrop project is LIVE!";
        String content = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #d1fae5; border-radius: 12px; background-color: #f0fdf4;">
                <h2 style="color: #059669; margin-top: 0;">✅ Project Restored!</h2>
                <p style="font-size: 14px; color: #374151;">Good news!</p>
                <p style="font-size: 14px; color: #374151;">Your project <strong>%s</strong> is now responding with valid HTTP 2xx/3xx statuses and has been restored to <strong>LIVE 🔥</strong> on the feed.</p>
                <div style="background-color: #ecfdf5; padding: 12px; border-radius: 8px; font-family: monospace; color: #065f46; margin: 15px 0;">
                    Target URL: <a href="%s" style="color: #047857;">%s</a>
                </div>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 11px; color: #9ca3af;">Sent by HotDrop Autonomous Link Monitoring Engine</p>
            </div>
            """.formatted(projectTitle, projectUrl, projectUrl);

        sendHtmlMail(recipientEmail, subject, content);
    }

    private void sendHtmlMail(String to, String subject, String htmlBody) {
        log.info("Preparing to send email to: {} with subject: '{}'", to, subject);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            helper.setFrom("hotdrop1229@gmail.com", "HotDrop");

            mailSender.send(message);
            log.info("Email dispatched successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }

    @Override
    @Async
    public void sendOTP(String toEmail, String name, String otpCode) {
        log.info("Sending OTP email to: {}", toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom("hotdrop1229@gmail.com", "HotDrop");
            helper.setTo(toEmail);
            helper.setSubject("Your HotDrop Verification Code");

            String htmlContent = String.format(
                    "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>" +
                            "<h3 style='color: #111;'>Hey %s, welcome to HotDrop!</h3>" +
                            "<p style='color: #555; font-size: 16px;'>Please use the verification code below to activate your account:</p>" +
                            "<div style='background-color: #f4f4f4; border: 1px dashed #111; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #111; margin: 20px 0; border-radius: 5px;'>" +
                            "    %s" +
                            "</div>" +
                            "<p style='color: #888; font-size: 14px;'>This code is valid for 15 minutes. Please do not share it with anyone.</p>" +
                            "</div>",
                    name, otpCode
            );

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("OTP email successfully sent to: {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage(), e);
        }
    }
}
