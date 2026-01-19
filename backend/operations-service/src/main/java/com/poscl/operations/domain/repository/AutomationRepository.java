package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.Automation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AutomationRepository extends JpaRepository<Automation, UUID> {

    List<Automation> findByTenantId(UUID tenantId);

    List<Automation> findByTenantIdAndActiveTrue(UUID tenantId);

    // To find automations triggered by a specific event (e.g. NEW_RESERVATION)
    List<Automation> findByTenantIdAndTriggerEventAndActiveTrue(UUID tenantId, String triggerEvent);
}
