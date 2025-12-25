package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.LoyaltyCustomer;
import com.poscl.operations.domain.entity.LoyaltyTransaction;
import com.poscl.operations.domain.entity.Reward;
import com.poscl.operations.domain.repository.LoyaltyCustomerRepository;
import com.poscl.operations.domain.repository.LoyaltyTransactionRepository;
import com.poscl.operations.domain.repository.RewardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyService {

    private final LoyaltyCustomerRepository customerRepository;
    private final LoyaltyTransactionRepository transactionRepository;
    private final RewardRepository rewardRepository;

    // ==================== CUSTOMERS ====================

    public Page<LoyaltyCustomer> getCustomers(UUID tenantId, Pageable pageable) {
        return customerRepository.findByTenantIdAndActivo(tenantId, true, pageable);
    }

    public Optional<LoyaltyCustomer> getCustomerById(UUID customerId) {
        return customerRepository.findById(customerId);
    }

    public List<LoyaltyCustomer> searchCustomers(UUID tenantId, String query) {
        return customerRepository.searchByQuery(tenantId, query);
    }

    @Transactional
    public LoyaltyCustomer createCustomer(UUID tenantId, String nombre, String email, String telefono) {
        LoyaltyCustomer customer = LoyaltyCustomer.builder()
                .tenantId(tenantId)
                .nombre(nombre)
                .email(email)
                .telefono(telefono)
                .build();
        
        log.info("Creating loyalty customer: {} for tenant: {}", nombre, tenantId);
        return customerRepository.save(customer);
    }

    @Transactional
    public LoyaltyCustomer updateCustomer(UUID customerId, String nombre, String email, String telefono) {
        LoyaltyCustomer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));
        
        customer.setNombre(nombre);
        customer.setEmail(email);
        customer.setTelefono(telefono);
        
        return customerRepository.save(customer);
    }

    // ==================== POINTS ====================

    @Transactional
    public LoyaltyTransaction addPoints(UUID customerId, int points, String description, UUID saleId) {
        LoyaltyCustomer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));
        
        customer.addPoints(points);
        customerRepository.save(customer);
        
        LoyaltyTransaction transaction = LoyaltyTransaction.earn(customer, points, description, saleId);
        transactionRepository.save(transaction);
        
        log.info("Added {} points to customer {}, new total: {}", points, customerId, customer.getPuntosActuales());
        return transaction;
    }

    @Transactional
    public Optional<LoyaltyTransaction> redeemPoints(UUID customerId, int points, String description) {
        LoyaltyCustomer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));
        
        if (!customer.redeemPoints(points)) {
            log.warn("Customer {} has insufficient points: {} required, {} available", 
                    customerId, points, customer.getPuntosActuales());
            return Optional.empty();
        }
        
        customerRepository.save(customer);
        
        LoyaltyTransaction transaction = LoyaltyTransaction.redeem(customer, points, description);
        transactionRepository.save(transaction);
        
        log.info("Redeemed {} points from customer {}", points, customerId);
        return Optional.of(transaction);
    }

    public List<LoyaltyTransaction> getTransactionHistory(UUID customerId) {
        return transactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    // ==================== REWARDS ====================

    public List<Reward> getActiveRewards(UUID tenantId) {
        return rewardRepository.findByTenantIdAndActivo(tenantId, true);
    }

    @Transactional
    public Reward createReward(UUID tenantId, String nombre, String descripcion, 
                               int puntosRequeridos, String tipo, java.math.BigDecimal valor) {
        Reward reward = Reward.builder()
                .tenantId(tenantId)
                .nombre(nombre)
                .descripcion(descripcion)
                .puntosRequeridos(puntosRequeridos)
                .tipo(tipo)
                .valor(valor)
                .build();
        
        log.info("Creating reward: {} for tenant: {}", nombre, tenantId);
        return rewardRepository.save(reward);
    }

    @Transactional
    public Reward toggleRewardActive(UUID rewardId) {
        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new IllegalArgumentException("Reward not found: " + rewardId));
        
        reward.setActivo(!reward.getActivo());
        return rewardRepository.save(reward);
    }

    // ==================== STATS ====================

    public LoyaltyStats getStats(UUID tenantId) {
        Long activeCustomers = customerRepository.countActiveByTenantId(tenantId);
        Long totalPoints = customerRepository.sumPuntosActualesByTenantId(tenantId);
        
        return new LoyaltyStats(
                activeCustomers != null ? activeCustomers : 0,
                totalPoints != null ? totalPoints : 0,
                rewardRepository.findByTenantIdAndActivo(tenantId, true).size()
        );
    }

    public record LoyaltyStats(long totalCustomers, long totalPointsInCirculation, int activeRewards) {}
}
