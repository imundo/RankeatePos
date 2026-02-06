package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.Automation;
import com.poscl.operations.domain.entity.AutomationLog;
import com.poscl.operations.domain.entity.Reservation;
import com.poscl.operations.domain.repository.AutomationLogRepository;
import com.poscl.operations.domain.repository.AutomationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutomationService {

    private final AutomationRepository automationRepository;
    private final com.poscl.operations.domain.repository.AutomationConfigRepository automationConfigRepository;
    private final AutomationLogRepository automationLogRepository;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final MercadoPagoService mercadoPagoService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public List<Automation> getAutomations(UUID tenantId) {
        return automationRepository.findByTenantId(tenantId);
    }

    @Transactional
    public Automation saveAutomation(Automation automation) {
        return automationRepository.save(automation);
    }

    @Transactional
    public Automation toggleAutomation(UUID automationId) {
        Automation automation = automationRepository.findById(automationId)
                .orElseThrow(() -> new RuntimeException("Automation not found"));
        automation.setActive(!automation.getActive());
        automation.setUpdatedAt(LocalDateTime.now());
        return automationRepository.save(automation);
    }

    public List<AutomationLog> getLogs(UUID automationId) {
        return automationLogRepository.findByAutomationIdOrderBySentAtDesc(automationId);
    }

    public List<AutomationLog> getAllLogs(UUID tenantId, int limit) {
        // Get all logs ordered by date, limited
        return automationLogRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getSentAt().compareTo(a.getSentAt()))
                .limit(limit)
                .toList();
    }

    public com.poscl.operations.domain.entity.AutomationConfig getAutomationConfig(UUID tenantId) {
        return automationConfigRepository.findByTenantId(tenantId)
                .orElse(com.poscl.operations.domain.entity.AutomationConfig.builder()
                        .tenantId(tenantId)
                        .emailConfig("{}")
                        .whatsappConfig("{}")
                        .mercadoPagoConfig("{}")
                        .build());
    }

    @Transactional
    public com.poscl.operations.domain.entity.AutomationConfig saveAutomationConfig(
            com.poscl.operations.domain.entity.AutomationConfig config) {
        // Check if exists
        var existing = automationConfigRepository.findByTenantId(config.getTenantId());
        if (existing.isPresent()) {
            var dbConfig = existing.get();
            dbConfig.setWhatsappConfig(config.getWhatsappConfig());
            dbConfig.setEmailConfig(config.getEmailConfig());
            dbConfig.setMercadoPagoConfig(config.getMercadoPagoConfig());
            dbConfig.setBusinessInfo(config.getBusinessInfo());
            dbConfig.setTemplates(config.getTemplates());
            return automationConfigRepository.save(dbConfig);
        }
        return automationConfigRepository.save(config);
    }

    /**
     * Trigger automations based on an event type for a specific reservation
     */
    @Async
    public void triggerAutomations(UUID tenantId, String eventType, Reservation reservation) {
        List<Automation> automations = automationRepository.findByTenantIdAndTriggerEventAndActiveTrue(tenantId,
                eventType);

        log.info("Triggering {} automations for event {} in tenant {}", automations.size(), eventType, tenantId);

        for (Automation automation : automations) {
            try {
                processAutomation(automation, reservation);
            } catch (Exception e) {
                log.error("Error processing automation {}: {}", automation.getId(), e.getMessage());
            }
        }
    }

    private void processAutomation(Automation automation, Reservation reservation) {
        String channels = automation.getChannels();

        // Fetch Tenant Configuration
        var config = getAutomationConfig(automation.getTenantId());

        String messageContent = replaceVariables(automation.getTemplateContent(), reservation, config);

        if (channels != null && channels.contains("email")) {
            sendEmail(automation, reservation, messageContent, config);
        }

        if (channels != null && channels.contains("whatsapp")) {
            sendWhatsApp(automation, reservation, messageContent);
        }
    }

    /**
     * Replace template variables with actual reservation data
     */
    private String replaceVariables(String template, Reservation reservation,
            com.poscl.operations.domain.entity.AutomationConfig config) {
        if (template == null)
            return "";

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String mpToken = extractMpToken(config);
        String businessName = extractBusinessName(config);

        String result = template
                .replace("{{cliente}}", reservation.getClienteNombre() != null ? reservation.getClienteNombre() : "")
                .replace("{{fecha}}",
                        reservation.getFecha() != null ? reservation.getFecha().format(dateFormatter) : "")
                .replace("{{hora}}", reservation.getHora() != null ? reservation.getHora().toString() : "")
                .replace("{{personas}}", String.valueOf(reservation.getPersonas()))
                .replace("{{negocio}}", businessName);

        // Handle payment link generation
        if (result.contains("{{linkPago}}")) {
            // Default amount from config or fallback
            BigDecimal amount = extractDefaultAmount(config);

            String paymentLink = mercadoPagoService.generatePaymentLink(
                    mpToken,
                    amount,
                    "Reserva " + reservation.getId().toString().substring(0, 8),
                    reservation.getId());
            result = result.replace("{{linkPago}}", paymentLink != null ? paymentLink : "#");
        }

        return result;
    }

    private String extractBusinessName(com.poscl.operations.domain.entity.AutomationConfig config) {
        try {
            if (config.getBusinessInfo() != null && !config.getBusinessInfo().isEmpty()) {
                var node = objectMapper.readTree(config.getBusinessInfo());
                if (node.has("negocioNombre")) {
                    return node.get("negocioNombre").asText();
                }
            }
        } catch (Exception e) {
            log.error("Error parsing Business Info for tenant {}", config.getTenantId(), e);
        }
        return "Tu Negocio";
    }

    private BigDecimal extractDefaultAmount(com.poscl.operations.domain.entity.AutomationConfig config) {
        try {
            if (config.getMercadoPagoConfig() != null && !config.getMercadoPagoConfig().isEmpty()) {
                var node = objectMapper.readTree(config.getMercadoPagoConfig());
                if (node.has("defaultAmount")) {
                    return new BigDecimal(node.get("defaultAmount").asText());
                }
            }
        } catch (Exception e) {
            log.error("Error parsing MP config for amount", e);
        }
        return new BigDecimal("10000"); // Fallback
    }

    private String extractMpToken(com.poscl.operations.domain.entity.AutomationConfig config) {
        try {
            if (config.getMercadoPagoConfig() != null && !config.getMercadoPagoConfig().isEmpty()) {
                var node = objectMapper.readTree(config.getMercadoPagoConfig());
                if (node.has("accessToken")) {
                    return node.get("accessToken").asText();
                }
            }
        } catch (Exception e) {
            log.error("Error parsing MP config for tenant {}", config.getTenantId(), e);
        }
        return null;
    }

    /**
     * Extract subject from template content (JSON format)
     */
    private String extractSubject(String templateContent) {
        // Simple extraction - in production use Jackson
        if (templateContent != null && templateContent.contains("\"asunto\":")) {
            int start = templateContent.indexOf("\"asunto\":\"") + 10;
            int end = templateContent.indexOf("\"", start);
            if (end > start) {
                return templateContent.substring(start, end);
            }
        }
        return "Notificación de Reserva";
    }

    private void sendEmail(Automation automation, Reservation reservation, String messageContent,
            com.poscl.operations.domain.entity.AutomationConfig config) {
        String email = reservation.getClienteEmail();
        if (email == null || email.isEmpty()) {
            log.warn("No email for reservation {}", reservation.getId());
            createLog(automation, reservation, "EMAIL", "FAILED", "No email address");
            return;
        }

        String subject = extractSubject(automation.getTemplateContent());
        subject = replaceVariables(subject, reservation, config);

        boolean success = emailService.send(email, subject, messageContent);

        log.info("Email {} for automation {} to {}",
                success ? "sent" : "failed", automation.getNombre(), email);

        createLog(automation, reservation, "EMAIL",
                success ? "SENT" : "FAILED",
                success ? null : "Email sending failed");
    }

    private void sendWhatsApp(Automation automation, Reservation reservation, String messageContent) {
        String phone = reservation.getClienteTelefono();
        if (phone == null || phone.isEmpty()) {
            log.warn("No phone for reservation {}", reservation.getId());
            createLog(automation, reservation, "WHATSAPP", "FAILED", "No phone number");
            return;
        }

        String plainText = convertHtmlToWhatsApp(messageContent);

        boolean success = whatsAppService.send(phone, plainText);

        log.info("WhatsApp {} for automation {} to {}",
                success ? "sent" : "failed", automation.getNombre(), phone);

        createLog(automation, reservation, "WHATSAPP",
                success ? "SENT" : "FAILED",
                success ? null : "WhatsApp sending failed");
    }

    private String convertHtmlToWhatsApp(String html) {
        if (html == null)
            return "";

        String result = html;

        // Structure
        result = result.replace("<br>", "\n")
                .replace("<br/>", "\n")
                .replace("<br />", "\n")
                .replace("</p>", "\n\n")
                .replace("</div>", "\n");

        // Formatting
        result = result.replaceAll("<b>(.*?)</b>", "*$1*")
                .replaceAll("<strong>(.*?)</strong>", "*$1*")
                .replaceAll("<i>(.*?)</i>", "_$1_")
                .replaceAll("<em>(.*?)</em>", "_$1_");

        // Strip remaining tags
        result = result.replaceAll("<[^>]+>", "");

        // Decode common entities (basic)
        result = result.replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">");

        return result.trim();
    }

    public boolean hasLogForReservation(UUID reservationId, String triggerEvent) {
        // Find if there is any log for this reservation with an automation triggered by
        // this event
        // This is a simplified check. Ideally we match the exact automation type.
        // For now, checks if ANY automation log for this reservation exists with the
        // corresponding channel/status logic
        // But since we store "automationId", we first need to know which automation is
        // "REMINDER_24H".
        // Instead, let's look for logs created in the last 24h for this reservation.

        List<AutomationLog> logs = automationLogRepository.findByReservationIdOrderBySentAtDesc(reservationId);
        return logs.stream().anyMatch(
                log -> log.getSentAt().isAfter(LocalDateTime.now().minusHours(24)) && "SENT".equals(log.getStatus()));
    }

    private void createLog(Automation automation, Reservation reservation, String channel, String status,
            String error) {
        AutomationLog logEntry = AutomationLog.builder()
                .automationId(automation.getId())
                .reservationId(reservation.getId())
                .channel(channel)
                .status(status)
                .sentAt(LocalDateTime.now())
                .errorMessage(error)
                .build();

        automationLogRepository.save(logEntry);
    }
}
