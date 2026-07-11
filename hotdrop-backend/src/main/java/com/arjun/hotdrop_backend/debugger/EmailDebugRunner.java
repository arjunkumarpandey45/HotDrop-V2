package com.arjun.hotdrop_backend.debugger;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailDebugRunner implements CommandLineRunner {

    private final JavaMailSender mailSender;

    @Override
    public void run(String... args) {
        log.info("Starting SMTP connection test manually...");
        try {
            MimeMessage message = mailSender.createMimeMessage();

            mailSender.send(message);
        } catch (Exception e) {
            System.out.println("\n================= SMTP ERROR LOG =================");
            System.out.println("Error Message: " + e.getMessage());
            if (e.getCause() != null) {
                System.out.println("Root Cause: " + e.getCause().getMessage());
            }
            System.out.println("==================================================\n");
        }
    }
}
