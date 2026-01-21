package com.poscl.operations.application.scheduler;

import com.poscl.operations.application.service.AutomationService;
import com.poscl.operations.domain.entity.Reservation;
import com.poscl.operations.domain.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler for automated reservation reminders
 */
@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class AutomationScheduler {

    private final ReservationRepository reservationRepository;
    private final AutomationService automationService;

    /**
     * Run every hour to check for 24h reminders
     * Checks for reservations scheduled for tomorrow
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour at minute 0
    public void processReminders24h() {
        log.info("Running 24h reminder check...");

        LocalDate tomorrow = LocalDate.now().plusDays(1);

        List<Reservation> reservations = reservationRepository.findByFechaAndEstado(
                tomorrow,
                "CONFIRMADA");

        log.info("Found {} reservations for tomorrow requiring 24h reminder", reservations.size());

        for (Reservation reservation : reservations) {
            try {
                // Check if we haven't already sent a 24h reminder
                if (!hasRecentReminder(reservation, "REMINDER_24H")) {
                    automationService.triggerAutomations(
                            reservation.getTenantId(),
                            "REMINDER_24H",
                            reservation);
                }
            } catch (Exception e) {
                log.error("Error sending 24h reminder for reservation {}: {}",
                        reservation.getId(), e.getMessage());
            }
        }
    }

    /**
     * Run every 30 minutes to check for 2h reminders
     */
    @Scheduled(cron = "0 0,30 * * * *") // Every 30 minutes
    public void processReminders2h() {
        log.info("Running 2h reminder check...");

        LocalDate today = LocalDate.now();
        LocalDateTime targetTime = LocalDateTime.now().plusHours(2);
        java.time.LocalTime start = java.time.LocalTime.of(targetTime.getHour(), 0);
        java.time.LocalTime end = java.time.LocalTime.of(targetTime.getHour(), 59, 59);

        List<Reservation> reservations = reservationRepository.findByFechaAndHoraBetweenAndEstado(
                today,
                start,
                end,
                "CONFIRMADA");

        log.info("Found {} reservations in ~2h requiring reminder", reservations.size());

        for (Reservation reservation : reservations) {
            try {
                if (!hasRecentReminder(reservation, "REMINDER_2H")) {
                    automationService.triggerAutomations(
                            reservation.getTenantId(),
                            "REMINDER_2H",
                            reservation);
                }
            } catch (Exception e) {
                log.error("Error sending 2h reminder for reservation {}: {}",
                        reservation.getId(), e.getMessage());
            }
        }
    }

    /**
     * Run every night at 22:00 to send post-visit thank you messages
     */
    @Scheduled(cron = "0 0 22 * * *") // Every day at 22:00
    public void processPostVisitMessages() {
        log.info("Running post-visit message check...");

        LocalDate today = LocalDate.now();

        List<Reservation> completedReservations = reservationRepository.findByFechaAndEstado(
                today,
                "COMPLETADA");

        log.info("Found {} completed reservations for post-visit messages", completedReservations.size());

        for (Reservation reservation : completedReservations) {
            try {
                automationService.triggerAutomations(
                        reservation.getTenantId(),
                        "POST_VISITA",
                        reservation);
            } catch (Exception e) {
                log.error("Error sending post-visit message for reservation {}: {}",
                        reservation.getId(), e.getMessage());
            }
        }
    }

    /**
     * Check if a reminder was recently sent to avoid duplicates
     */
    private boolean hasRecentReminder(Reservation reservation, String eventType) {
        // In production, check AutomationLog for recent entries
        // For now, return false to always send
        // TODO: Implement check against AutomationLog
        return false;
    }
}
