package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {

    List<SubscriptionPlan> findByTenantIdAndActivoOrderByPrecioAsc(UUID tenantId, Boolean activo);

    List<SubscriptionPlan> findByTenantIdOrderByNombreAsc(UUID tenantId);
}
