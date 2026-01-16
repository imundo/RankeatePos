package com.poscl.billing.domain.repository;

import com.poscl.billing.domain.entity.CertificadoDigital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository para certificados digitales
 */
@Repository
public interface CertificadoDigitalRepository extends JpaRepository<CertificadoDigital, UUID> {

    @Query("SELECT c FROM CertificadoDigital c WHERE c.tenantId = :tenantId AND c.activo = true AND c.fechaVencimiento > CURRENT_DATE ORDER BY c.createdAt DESC")
    Optional<CertificadoDigital> findActivoByTenantId(UUID tenantId);

    Optional<CertificadoDigital> findByIdAndTenantId(UUID id, UUID tenantId);
}
