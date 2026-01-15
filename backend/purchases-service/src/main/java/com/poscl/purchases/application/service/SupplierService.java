package com.poscl.purchases.application.service;

import com.poscl.purchases.domain.entity.Supplier;
import com.poscl.purchases.domain.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    @Transactional(readOnly = true)
    public List<Supplier> findAll(UUID tenantId) {
        return supplierRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public List<Supplier> findActive(UUID tenantId) {
        return supplierRepository.findByTenantIdAndIsActiveTrue(tenantId);
    }

    @Transactional(readOnly = true)
    public Optional<Supplier> findById(UUID tenantId, UUID id) {
        return supplierRepository.findById(id)
                .filter(s -> s.getTenantId().equals(tenantId));
    }

    @Transactional(readOnly = true)
    public Optional<Supplier> findByRut(UUID tenantId, String rut) {
        return supplierRepository.findByTenantIdAndRut(tenantId, rut);
    }

    @Transactional
    public Supplier create(UUID tenantId, Supplier supplier) {
        if (supplierRepository.existsByTenantIdAndRut(tenantId, supplier.getRut())) {
            throw new IllegalArgumentException("Ya existe un proveedor con RUT: " + supplier.getRut());
        }
        supplier.setTenantId(tenantId);
        supplier.setIsActive(true);
        log.info("Creating supplier: {} for tenant: {}", supplier.getBusinessName(), tenantId);
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier update(UUID tenantId, UUID id, Supplier updated) {
        Supplier existing = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado"));

        existing.setFantasyName(updated.getFantasyName());
        existing.setContactName(updated.getContactName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setAddress(updated.getAddress());
        existing.setCity(updated.getCity());
        existing.setPaymentTerms(updated.getPaymentTerms());

        return supplierRepository.save(existing);
    }

    @Transactional
    public void deactivate(UUID tenantId, UUID id) {
        Supplier supplier = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado"));
        supplier.setIsActive(false);
        supplierRepository.save(supplier);
        log.info("Deactivated supplier: {}", id);
    }

    @Transactional(readOnly = true)
    public long countActive(UUID tenantId) {
        return supplierRepository.countByTenantIdAndIsActiveTrue(tenantId);
    }
}
