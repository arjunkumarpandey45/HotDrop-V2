package com.arjun.hotdrop_backend.service;

import com.arjun.hotdrop_backend.service.impl.EmailServiceImpl;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        when(mailSender.createMimeMessage()).thenAnswer(inv -> new MimeMessage((Session) null));
    }

    @Nested
    @DisplayName("Verification Email Tests")
    class VerificationEmailTests {

        @Test
        @DisplayName("Should successfully send verification email")
        void sendVerificationEmail_Success() {
            emailService.sendVerificationEmail("dev@hotdrop.io", "Arjun", "https://hotdrop.io/verify?token=123");

            verify(mailSender).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("Should throw RuntimeException when mailSender throws exception")
        void sendVerificationEmail_MailSenderFails_ThrowsRuntimeException() {
            doThrow(new MailSendException("SMTP server connection timeout"))
                    .when(mailSender).send(any(MimeMessage.class));

            assertThatThrownBy(() -> emailService.sendVerificationEmail("dev@hotdrop.io", "Arjun", "https://hotdrop.io/verify?token=123"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Failed to send verification email due to an external service error.");
        }
    }

    @Nested
    @DisplayName("OTP Email Tests")
    class OtpEmailTests {

        @Test
        @DisplayName("Should successfully send OTP verification email")
        void sendOTP_Success() {
            emailService.sendOTP("dev@hotdrop.io", "Arjun", "654321");

            verify(mailSender).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("Should throw RuntimeException when sending OTP fails")
        void sendOTP_MailSenderFails_ThrowsRuntimeException() {
            doThrow(new MailSendException("Authentication failed"))
                    .when(mailSender).send(any(MimeMessage.class));

            assertThatThrownBy(() -> emailService.sendOTP("dev@hotdrop.io", "Arjun", "654321"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Failed to send verification code email due to an external service error.");
        }
    }

    @Nested
    @DisplayName("Project Alert Email Tests")
    class ProjectAlertEmailTests {

        @Test
        @DisplayName("Should successfully send project down alert")
        void sendProjectDownAlert_Success() {
            emailService.sendProjectDownAlert("dev@hotdrop.io", "My SaaS", "https://mysaas.com");

            verify(mailSender).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("Should throw RuntimeException when sending project down alert fails")
        void sendProjectDownAlert_MailSenderFails_ThrowsRuntimeException() {
            doThrow(new MailSendException("Mail queue full"))
                    .when(mailSender).send(any(MimeMessage.class));

            assertThatThrownBy(() -> emailService.sendProjectDownAlert("dev@hotdrop.io", "My SaaS", "https://mysaas.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Failed to send HTML email due to an external service error.");
        }

        @Test
        @DisplayName("Should successfully send project up alert")
        void sendProjectUpAlert_Success() {
            emailService.sendProjectUpAlert("dev@hotdrop.io", "My SaaS", "https://mysaas.com");

            verify(mailSender).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("Should throw RuntimeException when sending project up alert fails")
        void sendProjectUpAlert_MailSenderFails_ThrowsRuntimeException() {
            doThrow(new MailSendException("Network unreachable"))
                    .when(mailSender).send(any(MimeMessage.class));

            assertThatThrownBy(() -> emailService.sendProjectUpAlert("dev@hotdrop.io", "My SaaS", "https://mysaas.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Failed to send HTML email due to an external service error.");
        }
    }
}
