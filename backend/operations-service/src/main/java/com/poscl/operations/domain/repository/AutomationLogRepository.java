package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.AutomationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AutomationLogRepository extends JpaRepository<AutomationLog, UUID> {

    List<AutomationLog> findByAutomationIdOrderBySentAtDesc(UUID automationId);

    List<AutomationLog> findByReservationIdOrderBySentAtDesc(UUID reservationId);

    // Helper to check if a specific message was already sent (prevent duplicates)
    boolean existsByAutomationIdAndReservationIdAndStatus(UUID automationId, UUID reservationId, String status);
}
