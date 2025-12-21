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

    Page<Dte> findByTenantId(UUID tenantId, Pageable pageable);

    Page<Dte> findByTenantIdAndTipoDte(UUID tenantId, TipoDte tipoDte, Pageable pageable);

    Page<Dte> findByTenantIdAndEstado(UUID tenantId, EstadoDte estado, Pageable pageable);

    @Query("SELECT d FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision BETWEEN :desde AND :hasta")
    Page<Dte> findByTenantIdAndFechaEmisionBetween(UUID tenantId, LocalDate desde, LocalDate hasta, Pageable pageable);

    @Query("SELECT d FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision BETWEEN :desde AND :hasta AND d.tipoDte = :tipoDte")
    List<Dte> findForLibroVentas(UUID tenantId, LocalDate desde, LocalDate hasta, TipoDte tipoDte);

    List<Dte> findByTenantIdAndEstadoAndFechaEnvioIsNull(UUID tenantId, EstadoDte estado);

    @Query("SELECT d FROM Dte d WHERE d.estado = :estado AND d.trackId IS NOT NULL AND d.fechaRespuesta IS NULL")
    List<Dte> findPendientesRespuesta(EstadoDte estado);

    @Query("SELECT COUNT(d) FROM Dte d WHERE d.tenantId = :tenantId AND d.tipoDte = :tipoDte AND d.fechaEmision = :fecha")
    long countByTenantIdAndTipoDteAndFecha(UUID tenantId, TipoDte tipoDte, LocalDate fecha);

    @Query("SELECT SUM(d.montoTotal) FROM Dte d WHERE d.tenantId = :tenantId AND d.fechaEmision = :fecha AND d.estado IN ('ACEPTADO', 'ACEPTADO_CON_REPAROS')")
    Optional<java.math.BigDecimal> sumMontoTotalByTenantIdAndFecha(UUID tenantId, LocalDate fecha);

    Optional<Dte> findByVentaIdAndTenantId(UUID ventaId, UUID tenantId);
}
