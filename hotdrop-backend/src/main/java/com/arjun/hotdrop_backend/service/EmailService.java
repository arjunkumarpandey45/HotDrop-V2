package com.arjun.hotdrop_backend.service;

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
public class EmailService {
    private final JavaMailSender mailSender;

    @Async
    public void sendVerificationEmail(String toEmail, String name, String verificationLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

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
        } catch (Exception e) {
           log.error("Failed to send verification email");
            throw new RuntimeException("Failed to send verification email", e);
        }
    }
}