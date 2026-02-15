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

        @Query("SELECT s.numero FROM Sale s WHERE s.tenantId = :tenantId AND s.numero LIKE :prefix% ORDER BY s.numero DESC LIMIT 1")
        String findMaxNumeroByPrefix(UUID tenantId, String prefix);

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

        // Billing Queue
        @Query("SELECT s FROM Sale s LEFT JOIN FETCH s.items WHERE s.tenantId = :tenantId AND s.dteStatus = :status")
        List<Sale> findByTenantIdAndDteStatus(UUID tenantId, Sale.DteStatus status);

        // Batch processing for scheduler
        List<Sale> findTop50ByDteStatus(Sale.DteStatus dteStatus, Pageable pageable);

        // Global batch fetch (ignore tenant filter implies admin usage or background
        // job)
        // Global batch fetch
        // Analytics
        @Query("SELECT new com.poscl.sales.api.dto.ProductPerformanceDto(i.productNombre, i.productSku, SUM(i.cantidad), SUM(i.total)) "
                        +
                        "FROM SaleItem i JOIN i.sale s " +
                        "WHERE s.createdAt BETWEEN :start AND :end AND s.tenantId = :tenantId " +
                        "GROUP BY i.productNombre, i.productSku " +
                        "ORDER BY SUM(i.total) DESC")
        List<com.poscl.sales.api.dto.ProductPerformanceDto> findTopProducts(UUID tenantId, Instant start, Instant end,
                        Pageable pageable);

        @Query("SELECT s.createdAt, s.total FROM Sale s WHERE s.tenantId = :tenantId AND s.createdAt BETWEEN :start AND :end ORDER BY s.createdAt ASC")
        List<Object[]> findSalesDataForTrend(UUID tenantId, Instant start, Instant end);

        @Query("SELECT new com.poscl.sales.api.dto.CustomerMetricDto(CAST(s.customerId AS string), s.customerNombre, MAX(s.createdAt), COUNT(s), CAST(SUM(s.total) AS bigdecimal), CAST(0 AS bigdecimal)) "
                        +
                        "FROM Sale s " +
                        "WHERE s.tenantId = :tenantId AND s.customerId IS NOT NULL AND s.createdAt BETWEEN :start AND :end "
                        +
                        "GROUP BY s.customerId, s.customerNombre " +
                        "ORDER BY SUM(s.total) DESC")
        List<com.poscl.sales.api.dto.CustomerMetricDto> findCustomerMetrics(UUID tenantId, Instant start, Instant end,
                        Pageable pageable);
}
