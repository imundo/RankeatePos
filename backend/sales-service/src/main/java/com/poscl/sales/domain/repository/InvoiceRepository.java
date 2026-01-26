package com.poscl.sales.domain.repository;

import com.poscl.sales.domain.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByTenantId(UUID tenantId);

    Optional<Invoice> findByTenantIdAndFolioAndType(UUID tenantId, Integer folio, Invoice.InvoiceType type);

    Optional<Invoice> findBySaleId(UUID saleId);

    Page<Invoice> findByTenantId(UUID tenantId, Pageable pageable);

    // For Reporting
    List<Invoice> findByTenantIdAndEmissionDateBetween(UUID tenantId, LocalDateTime start, LocalDateTime end);
}
