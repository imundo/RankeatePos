package com.poscl.crm.application.service;

import com.poscl.crm.api.dto.ChargeCreditRequest;
import com.poscl.crm.api.dto.PayCreditRequest;
import com.poscl.crm.domain.entity.CreditTransaction;
import com.poscl.crm.domain.entity.CustomerProfile;
import com.poscl.crm.domain.repository.CreditTransactionRepository;
import com.poscl.crm.domain.repository.CustomerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerProfileService {

    private final CustomerProfileRepository profileRepository;
    private final CreditTransactionRepository transactionRepository;

    // --- PROFILES & RFM ---

    public Page<CustomerProfile> getProfiles(UUID tenantId, Pageable pageable) {
        return profileRepository.findByTenantId(tenantId, pageable);
    }

    public CustomerProfile getProfileById(UUID id) {
        return profileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + id));
    }

    public List<CustomerProfile> searchProfiles(UUID tenantId, String query) {
        return profileRepository.searchByQuery(tenantId, query);
    }

    @Transactional
    public CustomerProfile createProfile(UUID tenantId, String fullName, String rut, String email, String phone) {
        CustomerProfile profile = CustomerProfile.builder()
                .tenantId(tenantId)
                .fullName(fullName)
                .rut(rut)
                .email(email)
                .phone(phone)
                .creditLimit(BigDecimal.ZERO)
                .currentDebt(BigDecimal.ZERO)
                .build();
        return profileRepository.save(profile);
    }
    
    @Transactional
    public CustomerProfile updateCreditLimit(UUID id, BigDecimal newLimit) {
        CustomerProfile profile = getProfileById(id);
        profile.setCreditLimit(newLimit);
        log.info("Updated credit limit for {} to {}", profile.getFullName(), newLimit);
        return profileRepository.save(profile);
    }

    @Transactional
    public void recordPurchaseEvent(UUID customerId, BigDecimal amount) {
        profileRepository.findById(customerId).ifPresent(profile -> {
            profile.recordPurchase(amount);
            profileRepository.save(profile);
        });
    }

    // --- CREDITO / FIADO ---

    public Page<CustomerProfile> getDebtors(UUID tenantId, Pageable pageable) {
        return profileRepository.findDebtorsByTenantId(tenantId, pageable);
    }

    public BigDecimal getTotalDebt(UUID tenantId) {
        BigDecimal total = profileRepository.sumTotalDebtByTenantId(tenantId);
        return total != null ? total : BigDecimal.ZERO;
    }

    /**
     * Endpoint llamado síncronamente por sales-service ANTES de finalizar la venta.
     */
    @Transactional
    public CreditTransaction chargeCredit(UUID customerId, ChargeCreditRequest request) {
        CustomerProfile profile = getProfileById(customerId);

        if (!profile.hasAvailableCredit(request.getAmount())) {
            log.warn("Customer {} (Limit: {}) exceeded credit for sale amount {}", 
                profile.getId(), profile.getCreditLimit(), request.getAmount());
            throw new IllegalArgumentException("Límite de crédito excedido o insuficiente");
        }

        profile.addDebt(request.getAmount());
        profileRepository.save(profile);

        CreditTransaction transaction = CreditTransaction.charge(
                profile, request.getAmount(), request.getSaleId(), request.getDescription());
        
        log.info("Charged {} to customer {} on sale {}", request.getAmount(), customerId, request.getSaleId());
        return transactionRepository.save(transaction);
    }

    /**
     * Endpoint para cuando un cliente viene a pagar su Fiado al local.
     */
    @Transactional
    public CreditTransaction payCredit(UUID customerId, PayCreditRequest request) {
        CustomerProfile profile = getProfileById(customerId);

        profile.payDebt(request.getAmount());
        profileRepository.save(profile);

        CreditTransaction transaction = CreditTransaction.pay(
                profile, request.getAmount(), request.getReference(), request.getDescription());
        
        log.info("Paid {} from customer {} debt", request.getAmount(), customerId);
        return transactionRepository.save(transaction);
    }

    public List<CreditTransaction> getTransactionHistory(UUID customerId) {
        return transactionRepository.findByCustomerProfileIdOrderByCreatedAtDesc(customerId);
    }
}
