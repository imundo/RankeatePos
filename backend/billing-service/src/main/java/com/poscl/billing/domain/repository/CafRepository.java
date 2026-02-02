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

       // Original method returning full entities (used by ChileSiiProvider)
       List<Caf> findByTenantIdAndActivoTrue(UUID tenantId);

       // Projections for optimized reading - Explicit JPQL to ensure LOBs (xmlCaf) are
       // excluded
       @Query("SELECT c.id as id, c.tenantId as tenantId, c.tipoDte as tipoDte, " +
                     "c.folioDesde as folioDesde, c.folioHasta as folioHasta, c.folioActual as folioActual, " +
                     "c.fechaAutorizacion as fechaAutorizacion, c.fechaVencimiento as fechaVencimiento, " +
                     "c.activo as activo, c.agotado as agotado " +
                     "FROM Caf c WHERE c.tenantId = :tenantId AND c.activo = true")
       List<CafSummary> findProjectedByTenantIdAndActivoTrue(UUID tenantId);

       @Query("SELECT c.id as id, c.tenantId as tenantId, c.tipoDte as tipoDte, " +
                     "c.folioDesde as folioDesde, c.folioHasta as folioHasta, c.folioActual as folioActual, " +
                     "c.fechaAutorizacion as fechaAutorizacion, c.fechaVencimiento as fechaVencimiento, " +
                     "c.activo as activo, c.agotado as agotado " +
                     "FROM Caf c WHERE c.tenantId = :tenantId AND c.tipoDte = :tipoDte AND c.activo = true")
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
