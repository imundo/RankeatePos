package com.poscl.billing.domain.repository;

import com.poscl.billing.domain.entity.Caf;
import com.poscl.billing.domain.enums.TipoDte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CafRepository extends JpaRepository<Caf, UUID> {

       List<Caf> findByTenantIdAndActivoTrue(UUID tenantId);

       // Projections for optimized reading
       List<CafSummary> findProjectedByTenantIdAndActivoTrue(UUID tenantId);

       List<Caf> findByTenantIdAndTipoDteAndActivoTrue(UUID tenantId, TipoDte tipoDte);

       List<CafSummary> findProjectedByTenantIdAndTipoDteAndActivoTrue(UUID tenantId, TipoDte tipoDte);

       @Query("SELECT c FROM Caf c WHERE c.tenantId = :tenantId AND c.tipoDte = :tipoDte " +
                     "AND c.activo = true AND c.agotado = false " +
                     "ORDER BY c.folioDesde ASC")
       Optional<Caf> findCafDisponible(UUID tenantId, TipoDte tipoDte);

       @Query("SELECT c FROM Caf c WHERE c.tenantId = :tenantId AND c.tipoDte = :tipoDte " +
                     "AND c.activo = true AND c.agotado = false " +
                     "ORDER BY c.folioDesde ASC LIMIT 1")
       Optional<Caf> findActiveCafByTenantAndTipo(UUID tenantId, TipoDte tipoDte);

       @Query("SELECT c FROM Caf c WHERE c.tenantId = :tenantId AND c.tipoDte = :tipoDte " +
                     "AND c.activo = true AND c.agotado = false AND c.folioActual <= c.folioHasta " +
                     "ORDER BY c.folioDesde ASC")
       List<Caf> findCafsDisponibles(UUID tenantId, TipoDte tipoDte);

       @Query("SELECT SUM(c.folioHasta - c.folioActual + 1) FROM Caf c " +
                     "WHERE c.tenantId = :tenantId AND c.tipoDte = :tipoDte " +
                     "AND c.activo = true AND c.agotado = false")
       Optional<Integer> countFoliosDisponibles(UUID tenantId, TipoDte tipoDte);

       boolean existsByTenantIdAndTipoDteAndFolioDesde(UUID tenantId, TipoDte tipoDte, Integer folioDesde);

       @Query("SELECT c FROM Caf c WHERE c.tenantId = :tenantId AND c.activo = true " +
                     "AND (c.fechaVencimiento IS NOT NULL AND c.fechaVencimiento < CURRENT_DATE)")
       List<Caf> findCafsVencidos(UUID tenantId);
}
