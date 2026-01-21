package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.PriceList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PriceListRepository extends JpaRepository<PriceList, UUID> {

    List<PriceList> findByTenantIdAndActivaTrue(UUID tenantId);

    List<PriceList> findByTenantId(UUID tenantId);

    Optional<PriceList> findByIdAndTenantId(UUID id, UUID tenantId);

    List<PriceList> findByTenantIdAndTipo(UUID tenantId, PriceList.TipoPrecio tipo);

    @Query("SELECT pl FROM PriceList pl WHERE pl.tenantId = :tenantId AND pl.sucursalId = :sucursalId AND pl.activa = true")
    List<PriceList> findBySucursal(@Param("tenantId") UUID tenantId, @Param("sucursalId") UUID sucursalId);

    @Query("SELECT pl FROM PriceList pl WHERE pl.tenantId = :tenantId AND pl.clienteId = :clienteId AND pl.activa = true")
    List<PriceList> findByCliente(@Param("tenantId") UUID tenantId, @Param("clienteId") UUID clienteId);

    @Query("""
            SELECT pl FROM PriceList pl
            WHERE pl.tenantId = :tenantId
            AND pl.tipo = 'TEMPORAL'
            AND pl.activa = true
            AND (pl.fechaInicio IS NULL OR pl.fechaInicio <= :fecha)
            AND (pl.fechaFin IS NULL OR pl.fechaFin >= :fecha)
            """)
    List<PriceList> findVigentes(@Param("tenantId") UUID tenantId, @Param("fecha") LocalDate fecha);

    /**
     * Encuentra todas las listas aplicables para un contexto dado
     */
    @Query("""
            SELECT pl FROM PriceList pl
            WHERE pl.tenantId = :tenantId
            AND pl.activa = true
            AND (
                pl.tipo = 'GENERAL'
                OR (pl.tipo = 'SUCURSAL' AND pl.sucursalId = :sucursalId)
                OR (pl.tipo = 'CLIENTE' AND pl.clienteId = :clienteId)
                OR (pl.tipo = 'TEMPORAL'
                    AND (pl.fechaInicio IS NULL OR pl.fechaInicio <= :fecha)
                    AND (pl.fechaFin IS NULL OR pl.fechaFin >= :fecha))
            )
            ORDER BY pl.prioridad DESC
            """)
    List<PriceList> findAplicables(
            @Param("tenantId") UUID tenantId,
            @Param("sucursalId") UUID sucursalId,
            @Param("clienteId") UUID clienteId,
            @Param("fecha") LocalDate fecha);
}
