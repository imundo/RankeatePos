package com.poscl.operations.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Email service supporting both SendGrid API and SMTP
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${sendgrid.api-key:}")
    private String sendGridApiKey;

    @Value("${email.from:noreply@rankeate.cl}")
    private String fromEmail;

    @Value("${email.from-name:Rankeate POS}")
    private String fromName;

    private final JavaMailSender mailSender;

    private static final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Send email using the best available method
     */
    public boolean send(String to, String subject, String body) {
        if (sendGridApiKey != null && !sendGridApiKey.isEmpty()) {
            return sendViaSendGrid(to, subject, body);
        }
        return sendViaSmtp(to, subject, body);
    }

    /**
     * Send email via SendGrid API
     */
    private boolean sendViaSendGrid(String to, String subject, String body) {
        try {
            String payload = String.format("""
                    {
                        "personalizations": [{"to": [{"email": "%s"}]}],
                        "from": {"email": "%s", "name": "%s"},
                        "subject": "%s",
                        "content": [{"type": "text/html", "value": "%s"}]
                    }
                    """, to, fromEmail, fromName,
                    subject.replace("\"", "\\\""),
                    body.replace("\"", "\\\"").replace("\n", "\\n"));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.sendgrid.com/v3/mail/send"))
                    .header("Authorization", "Bearer " + sendGridApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email sent successfully via SendGrid to {}", to);
                return true;
            } else {
                log.error("SendGrid error: {} - {}", response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("Error sending email via SendGrid", e);
            return false;
        }
    }

    /**
     * Send email via SMTP (fallback)
     */
    private boolean sendViaSmtp(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // HTML content

            mailSender.send(message);
            log.info("Email sent successfully via SMTP to {}", to);
            return true;
        } catch (Exception e) {
            log.error("Error sending email via SMTP to {}", to, e);
            return false;
        }
    }

    /**
     * Send simple text email
     */
    public boolean sendSimple(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            log.error("Error sending simple email to {}", to, e);
            return false;
        }
    }
}
