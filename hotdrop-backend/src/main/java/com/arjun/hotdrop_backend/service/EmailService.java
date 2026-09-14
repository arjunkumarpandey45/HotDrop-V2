package com.arjun.hotdrop_backend.service;

public interface EmailService {
    void sendVerificationEmail(String toEmail, String name, String verificationLink);
    void sendOTP(String toEmail, String name, String otpCode);
    void sendProjectUpAlert(String recipientEmail, String projectTitle, String projectUrl);
    void sendProjectDownAlert(String recipientEmail, String projectTitle, String projectUrl);
}