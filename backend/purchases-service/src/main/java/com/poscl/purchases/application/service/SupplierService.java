package com.poscl.purchases.application.service;

import com.poscl.purchases.domain.entity.Supplier;
import com.poscl.purchases.domain.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
        if (supplier.getRut() != null && supplierRepository.existsByTenantIdAndRut(tenantId, supplier.getRut())) {
            throw new IllegalArgumentException("Ya existe un proveedor con RUT: " + supplier.getRut());
        }
        supplier.setTenantId(tenantId);
        supplier.setIsActive(true);
        if (supplier.getStatus() == null) {
            supplier.setStatus(Supplier.SupplierStatus.ACTIVE);
        }
        log.info("Creating supplier: {} for tenant: {}", supplier.getBusinessName(), tenantId);
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier update(UUID tenantId, UUID id, Supplier updated) {
        Supplier existing = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado"));

        if (updated.getBusinessName() != null) existing.setBusinessName(updated.getBusinessName());
        if (updated.getFantasyName() != null) existing.setFantasyName(updated.getFantasyName());
        if (updated.getGiro() != null) existing.setGiro(updated.getGiro());
        if (updated.getContactName() != null) existing.setContactName(updated.getContactName());
        if (updated.getEmail() != null) existing.setEmail(updated.getEmail());
        if (updated.getPhone() != null) existing.setPhone(updated.getPhone());
        if (updated.getWebsite() != null) existing.setWebsite(updated.getWebsite());
        if (updated.getAddress() != null) existing.setAddress(updated.getAddress());
        if (updated.getCity() != null) existing.setCity(updated.getCity());
        if (updated.getPaymentTerms() != null) existing.setPaymentTerms(updated.getPaymentTerms());
        if (updated.getDiscountPercentage() != null) existing.setDiscountPercentage(updated.getDiscountPercentage());
        if (updated.getCurrency() != null) existing.setCurrency(updated.getCurrency());
        if (updated.getBankAccount() != null) existing.setBankAccount(updated.getBankAccount());
        if (updated.getBankName() != null) existing.setBankName(updated.getBankName());
        if (updated.getCategory() != null) existing.setCategory(updated.getCategory());
        if (updated.getDeliveryType() != null) existing.setDeliveryType(updated.getDeliveryType());
        if (updated.getAvgDeliveryDays() != null) existing.setAvgDeliveryDays(updated.getAvgDeliveryDays());
        if (updated.getNotes() != null) existing.setNotes(updated.getNotes());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());

        return supplierRepository.save(existing);
    }

    @Transactional
    public Supplier updateRating(UUID tenantId, UUID id, BigDecimal rating) {
        Supplier supplier = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado"));
        
        // Clamp rating between 1.0 and 5.0
        BigDecimal clamped = rating.max(BigDecimal.ONE).min(BigDecimal.valueOf(5));
        supplier.setTrustRating(clamped);
        log.info("Updated rating for supplier {} to {}", id, clamped);
        return supplierRepository.save(supplier);
    }

    @Transactional
    public void deactivate(UUID tenantId, UUID id) {
        Supplier supplier = findById(tenantId, id)
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado"));
        supplier.setIsActive(false);
        supplier.setStatus(Supplier.SupplierStatus.INACTIVE);
        supplierRepository.save(supplier);
        log.info("Deactivated supplier: {}", id);
    }

    @Transactional(readOnly = true)
    public long countActive(UUID tenantId) {
        return supplierRepository.countByTenantIdAndIsActiveTrue(tenantId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getAverageRating(UUID tenantId) {
        List<Supplier> active = findActive(tenantId);
        if (active.isEmpty()) return BigDecimal.ZERO;
        BigDecimal sum = active.stream()
                .map(s -> s.getTrustRating() != null ? s.getTrustRating() : BigDecimal.valueOf(3))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(active.size()), 1, RoundingMode.HALF_UP);
    }
}
