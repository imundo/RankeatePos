package com.poscl.operations.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * WhatsApp service using Twilio API
 */
@Service
@Slf4j
public class WhatsAppService {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.whatsapp-from:+14155238886}")
    private String fromNumber;

    private static final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Send WhatsApp message via Twilio
     */
    public boolean send(String to, String message) {
        if (accountSid == null || accountSid.isEmpty() || authToken == null || authToken.isEmpty()) {
            log.warn("Twilio credentials not configured, using simulation mode");
            return simulateSend(to, message);
        }

        try {
            // Normalize phone number
            String normalizedTo = normalizePhone(to);

            String twilioUrl = String.format(
                    "https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json",
                    accountSid);

            String body = String.format("From=%s&To=%s&Body=%s",
                    URLEncoder.encode("whatsapp:" + fromNumber, StandardCharsets.UTF_8),
                    URLEncoder.encode("whatsapp:" + normalizedTo, StandardCharsets.UTF_8),
                    URLEncoder.encode(message, StandardCharsets.UTF_8));

            String auth = Base64.getEncoder().encodeToString(
                    (accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(twilioUrl))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("WhatsApp message sent successfully to {}", normalizedTo);
                return true;
            } else {
                log.error("Twilio error: {} - {}", response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("Error sending WhatsApp message to {}", to, e);
            return false;
        }
    }

    /**
     * Normalize phone number to international format
     */
    private String normalizePhone(String phone) {
        // Remove all non-digit characters
        String digits = phone.replaceAll("[^0-9]", "");

        // Handle Chilean numbers (9 digits starting with 9)
        if (digits.length() == 9 && digits.startsWith("9")) {
            return "+56" + digits;
        }
        // Handle Chilean numbers with country code
        if (digits.length() == 11 && digits.startsWith("56")) {
            return "+" + digits;
        }
        // Already has + or is international format
        if (phone.startsWith("+")) {
            return phone;
        }
        // Default: assume it's Chilean
        if (digits.length() == 8 || digits.length() == 9) {
            return "+56" + digits;
        }
        return "+" + digits;
    }

    /**
     * Simulate sending for development/testing
     */
    private boolean simulateSend(String to, String message) {
        log.info("📱 [SIMULATION] WhatsApp to {}: {}", to,
                message.length() > 100 ? message.substring(0, 100) + "..." : message);
        return true;
    }

    /**
     * Check if WhatsApp is configured
     */
    public boolean isConfigured() {
        return accountSid != null && !accountSid.isEmpty()
                && authToken != null && !authToken.isEmpty();
    }
}
