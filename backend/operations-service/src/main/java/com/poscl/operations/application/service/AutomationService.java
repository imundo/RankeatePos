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
    private final AutomationLogRepository automationLogRepository;
    private final EmailService emailService;
    private final WhatsAppService whatsAppService;
    private final MercadoPagoService mercadoPagoService;

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
        String messageContent = replaceVariables(automation.getTemplateContent(), reservation);

        if (channels != null && channels.contains("email")) {
            sendEmail(automation, reservation, messageContent);
        }

        if (channels != null && channels.contains("whatsapp")) {
            sendWhatsApp(automation, reservation, messageContent);
        }
    }

    /**
     * Replace template variables with actual reservation data
     */
    private String replaceVariables(String template, Reservation reservation) {
        if (template == null)
            return "";

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        String result = template
                .replace("{{cliente}}", reservation.getClienteNombre() != null ? reservation.getClienteNombre() : "")
                .replace("{{fecha}}",
                        reservation.getFecha() != null ? reservation.getFecha().format(dateFormatter) : "")
                .replace("{{hora}}", reservation.getHora() != null ? reservation.getHora().toString() : "")
                .replace("{{personas}}", String.valueOf(reservation.getPersonas()))
                .replace("{{negocio}}", "Tu Negocio"); // TODO: Get from tenant config

        // Handle payment link generation
        if (result.contains("{{linkPago}}")) {
            String paymentLink = mercadoPagoService.generatePaymentLink(
                    new BigDecimal("50000"), // TODO: Get from reservation or config
                    "Reserva " + reservation.getId().toString().substring(0, 8),
                    reservation.getId());
            result = result.replace("{{linkPago}}", paymentLink != null ? paymentLink : "#");
        }

        return result;
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

    private void sendEmail(Automation automation, Reservation reservation, String messageContent) {
        String email = reservation.getClienteEmail();
        if (email == null || email.isEmpty()) {
            log.warn("No email for reservation {}", reservation.getId());
            createLog(automation, reservation, "EMAIL", "FAILED", "No email address");
            return;
        }

        String subject = extractSubject(automation.getTemplateContent());
        subject = replaceVariables(subject, reservation);

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

        // Strip HTML for WhatsApp
        String plainText = messageContent.replaceAll("<[^>]+>", "").trim();

        boolean success = whatsAppService.send(phone, plainText);

        log.info("WhatsApp {} for automation {} to {}",
                success ? "sent" : "failed", automation.getNombre(), phone);

        createLog(automation, reservation, "WHATSAPP",
                success ? "SENT" : "FAILED",
                success ? null : "WhatsApp sending failed");
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
