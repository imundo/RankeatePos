package com.poscl.billing.domain.repository;

import com.poscl.billing.domain.entity.CertificadoDigital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CertificadoRepository extends JpaRepository<CertificadoDigital, UUID> {

    Optional<CertificadoDigital> findByTenantIdAndActivoTrue(UUID tenantId);

    Optional<CertificadoDigital> findByTenantId(UUID tenantId);

    List<CertificadoDigital> findByActivoTrueAndFechaVencimientoBefore(LocalDate fecha);

    List<CertificadoDigital> findByActivoTrueAndFechaVencimientoBetween(LocalDate desde, LocalDate hasta);

    boolean existsByTenantIdAndActivoTrue(UUID tenantId);
}
