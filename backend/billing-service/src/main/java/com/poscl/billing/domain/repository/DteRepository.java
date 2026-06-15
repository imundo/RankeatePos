package com.poscl.billing.domain.repository;

import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.enums.EstadoDte;
import com.poscl.billing.domain.enums.TipoDte;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DteRepository extends JpaRepository<Dte, UUID> {

    Optional<Dte> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Dte> findByTenantIdAndTipoDteAndFolio(UUID tenantId, TipoDte tipoDte, Integer folio);

    Page<DteSummary> findByTenantId(UUID tenantId, Pageable pageable);

    Page<DteSummary> findByTenantIdAndTipoDte(UUID tenantId, TipoDte tipoDte, Pageable pageable);

    Page<DteSummary> findByTenantIdAndBranchId(UUID tenantId, UUID branchId, Pageable pageable);

    Page<DteSummary> findByTenantIdAndEstado(UUID tenantId, EstadoDte estado, Pageable pageable);

    @Query("SELECT d FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision BETWEEN :desde AND :hasta")
    Page<Dte> findByTenantIdAndFechaEmisionBetween(UUID tenantId, LocalDate desde, LocalDate hasta, Pageable pageable);

    @Query("SELECT d FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision BETWEEN :desde AND :hasta")
    List<Dte> findAllByTenantIdAndFechaEmisionBetween(UUID tenantId, LocalDate desde, LocalDate hasta);

    @Query("SELECT d FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision BETWEEN :desde AND :hasta AND d.tipoDte = :tipoDte")
    List<Dte> findForLibroVentas(UUID tenantId, LocalDate desde, LocalDate hasta, TipoDte tipoDte);

    List<Dte> findByTenantIdAndEstadoAndFechaEnvioIsNull(UUID tenantId, EstadoDte estado);

    @Query("SELECT d FROM Dte d WHERE d.estado = :estado AND d.trackId IS NOT NULL AND d.fechaRespuesta IS NULL")
    List<Dte> findPendientesRespuesta(EstadoDte estado);

    @Query("SELECT COUNT(d) FROM Dte d WHERE d.tenantId = :tenantId AND d.tipoDte = :tipoDte AND d.fechaEmision = :fecha")
    long countByTenantIdAndTipoDteAndFecha(UUID tenantId, TipoDte tipoDte, LocalDate fecha);

    @Query("SELECT SUM(d.montoTotal) FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision = :fecha AND d.estado IN (com.poscl.billing.domain.enums.EstadoDte.ACEPTADO, com.poscl.billing.domain.enums.EstadoDte.ACEPTADO_CON_REPAROS)")
    Optional<java.math.BigDecimal> sumMontoTotalByTenantIdAndFecha(UUID tenantId, LocalDate fecha);

    Optional<Dte> findByVentaIdAndTenantId(UUID ventaId, UUID tenantId);

    @Query("SELECT MAX(d.folio) FROM Dte d WHERE d.tenantId = :tenantId AND d.tipoDte = :tipoDte")
    Integer findMaxFolioByTenantAndTipo(UUID tenantId, TipoDte tipoDte);

    @Query("SELECT COUNT(d) FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision BETWEEN :desde AND :hasta")
    long countDtesMes(UUID tenantId, LocalDate desde, LocalDate hasta);

    @Query("SELECT COUNT(d) FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision BETWEEN :desde AND :hasta AND d.estado = com.poscl.billing.domain.enums.EstadoDte.ACEPTADO")
    long countDtesAceptadosMes(UUID tenantId, LocalDate desde, LocalDate hasta);

    @Query("SELECT COUNT(d) FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision BETWEEN :desde AND :hasta AND d.estado = com.poscl.billing.domain.enums.EstadoDte.PENDIENTE")
    long countDtesPendientesMes(UUID tenantId, LocalDate desde, LocalDate hasta);

    @Query("SELECT SUM(d.montoTotal) FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision BETWEEN :desde AND :hasta AND d.estado IN (com.poscl.billing.domain.enums.EstadoDte.ACEPTADO, com.poscl.billing.domain.enums.EstadoDte.ACEPTADO_CON_REPAROS)")
    Optional<java.math.BigDecimal> sumVentasMes(UUID tenantId, LocalDate desde, LocalDate hasta);

    @Query("SELECT SUM(d.montoTotal) FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision BETWEEN :desde AND :hasta AND d.estado = com.poscl.billing.domain.enums.EstadoDte.PENDIENTE")
    Optional<java.math.BigDecimal> sumVentasPendientesMes(UUID tenantId, LocalDate desde, LocalDate hasta);

    @Query("SELECT d FROM Dte d WHERE d.tenantId = :tenantId " +
           "AND (:tipoDte IS NULL OR d.tipoDte = :tipoDte) " +
           "AND (:estado IS NULL OR d.estado = :estado) " +
           "AND (:query IS NULL OR CAST(d.folio AS text) LIKE CONCAT('%', :query, '%') OR d.receptorRut LIKE CONCAT('%', :query, '%')) " +
           "AND (CAST(:desde as date) IS NULL OR d.fechaEmision >= :desde) " +
           "AND (CAST(:hasta as date) IS NULL OR d.fechaEmision <= :hasta)")
    Page<DteSummary> searchDtesWithFilters(
        @org.springframework.data.repository.query.Param("tenantId") UUID tenantId, 
        @org.springframework.data.repository.query.Param("tipoDte") TipoDte tipoDte, 
        @org.springframework.data.repository.query.Param("estado") EstadoDte estado, 
        @org.springframework.data.repository.query.Param("query") String query, 
        @org.springframework.data.repository.query.Param("desde") LocalDate desde, 
        @org.springframework.data.repository.query.Param("hasta") LocalDate hasta, 
        Pageable pageable);
}
