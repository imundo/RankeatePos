package com.poscl.sales.domain.repository;

import com.poscl.sales.domain.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SaleRepository extends JpaRepository<Sale, UUID> {

    // Idempotencia: buscar por commandId
    Optional<Sale> findByCommandId(UUID commandId);

    boolean existsByCommandId(UUID commandId);

    @Query("SELECT s FROM Sale s LEFT JOIN FETCH s.items LEFT JOIN FETCH s.payments WHERE s.id = :id AND s.tenantId = :tenantId")
    Optional<Sale> findByIdAndTenantIdWithDetails(UUID id, UUID tenantId);

    @Query("SELECT s FROM Sale s WHERE s.tenantId = :tenantId ORDER BY s.createdAt DESC")
    Page<Sale> findByTenantId(UUID tenantId, Pageable pageable);

    @Query("SELECT s FROM Sale s WHERE s.session.id = :sessionId ORDER BY s.createdAt DESC")
    Page<Sale> findBySessionId(UUID sessionId, Pageable pageable);

    @Query("SELECT s FROM Sale s WHERE s.tenantId = :tenantId AND s.createdAt BETWEEN :start AND :end ORDER BY s.createdAt DESC")
    Page<Sale> findByTenantIdAndDateRange(UUID tenantId, Instant start, Instant end, Pageable pageable);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(s.numero, 2) AS long)), 0) FROM Sale s WHERE s.tenantId = :tenantId AND s.numero LIKE :prefix%")
    Long findMaxNumeroByPrefix(UUID tenantId, String prefix);

    // ====== Métodos para aprobación de ventas ======

    // Ventas por estado
    List<Sale> findByTenantIdAndEstado(UUID tenantId, Sale.Estado estado);

    // Ventas pendientes ordenadas por fecha
    @Query("SELECT s FROM Sale s LEFT JOIN FETCH s.items LEFT JOIN FETCH s.payments " +
            "WHERE s.tenantId = :tenantId AND s.estado = :estado ORDER BY s.createdAt DESC")
    List<Sale> findByTenantIdAndEstadoWithDetails(UUID tenantId, Sale.Estado estado);

    // Ventas en rango de fechas (para estadísticas)
    @Query("SELECT s FROM Sale s WHERE s.tenantId = :tenantId AND s.createdAt >= :start AND s.createdAt < :end")
    List<Sale> findByTenantIdAndCreatedAtBetween(UUID tenantId, Instant start, Instant end);

    // Contar por estado
    long countByTenantIdAndEstado(UUID tenantId, Sale.Estado estado);
}
