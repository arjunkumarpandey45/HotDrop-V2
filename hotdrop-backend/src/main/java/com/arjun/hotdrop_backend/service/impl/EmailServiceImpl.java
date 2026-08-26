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
        } catch (Exception e) {
           log.error("Failed to send verification email");
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    @Override
    @Async
    public void sendOTP(String toEmail, String name, String otpCode) {
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
            log.info("OTP email successfully sent to {}", toEmail);

        } catch (Exception e) {

            log.error("Failed to send OTP to email: {}", toEmail, e);

        }
    }
}
