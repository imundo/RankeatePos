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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutomationService {

    private final AutomationRepository automationRepository;
    private final AutomationLogRepository automationLogRepository;

    public List<Automation> getAutomations(UUID tenantId) {
        return automationRepository.findByTenantId(tenantId);
    }

    @Transactional
    public Automation saveAutomation(Automation automation) {
        return automationRepository.save(automation);
    }

    public List<AutomationLog> getLogs(UUID automationId) {
        return automationLogRepository.findByAutomationIdOrderBySentAtDesc(automationId);
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
            processAutomation(automation, reservation);
        }
    }

    private void processAutomation(Automation automation, Reservation reservation) {
        // Parse channels JSON - simplified for demo
        // In real impl, use Jackson to parse JSON array
        String channels = automation.getChannels();

        if (channels != null && channels.contains("email")) {
            sendEmail(automation, reservation);
        }

        if (channels != null && channels.contains("whatsapp")) {
            sendWhatsApp(automation, reservation);
        }
    }

    private void sendEmail(Automation automation, Reservation reservation) {
        // Simulate sending email
        log.info("Sending Email for automation {} to {}", automation.getNombre(), reservation.getClienteEmail());

        createLog(automation, reservation, "EMAIL", "SENT", null);
    }

    private void sendWhatsApp(Automation automation, Reservation reservation) {
        // Simulate sending WhatsApp
        log.info("Sending WhatsApp for automation {} to {}", automation.getNombre(), reservation.getClienteTelefono());

        createLog(automation, reservation, "WHATSAPP", "SENT", null);
    }

    private void createLog(Automation automation, Reservation reservation, String channel, String status,
            String error) {
        AutomationLog logEntry = AutomationLog.builder()
                .automationId(automation.getId())
                .reservationId(reservation.getId())
                // .customerId(reservation.getCustomerId()) // Future integration
                .channel(channel)
                .status(status)
                .sentAt(LocalDateTime.now())
                .errorMessage(error)
                .build();

        automationLogRepository.save(logEntry);
    }
}
