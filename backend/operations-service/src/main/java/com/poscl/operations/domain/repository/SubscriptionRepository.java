package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    List<Subscription> findByTenantIdAndEstadoOrderByCreatedAtDesc(UUID tenantId, String estado);

    List<Subscription> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<Subscription> findByTenantIdAndProximaEntrega(UUID tenantId, LocalDate fecha);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.tenantId = :tenantId AND s.estado = :estado")
    Long countByTenantIdAndEstado(UUID tenantId, String estado);

    @Query("SELECT SUM(p.precio) FROM Subscription s JOIN s.plan p WHERE s.tenantId = :tenantId AND s.estado = 'ACTIVA'")
    java.math.BigDecimal calculateMonthlyRecurringRevenue(UUID tenantId);
}
