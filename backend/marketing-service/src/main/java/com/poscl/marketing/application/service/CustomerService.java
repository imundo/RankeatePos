package com.poscl.marketing.application.service;

import com.poscl.marketing.domain.entity.Customer;
import com.poscl.marketing.domain.entity.Customer.CustomerSegment;
import com.poscl.marketing.domain.entity.Customer.LoyaltyTier;
import com.poscl.marketing.domain.entity.CustomerInteraction;
import com.poscl.marketing.domain.entity.CustomerTag;
import com.poscl.marketing.domain.repository.CustomerInteractionRepository;
import com.poscl.marketing.domain.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CustomerService {
    
    private final CustomerRepository customerRepository;
    private final CustomerInteractionRepository interactionRepository;
    
    public Page<Customer> findAll(UUID tenantId, Pageable pageable) {
        return customerRepository.findByTenantId(tenantId, pageable);
    }
    
    public Page<Customer> search(UUID tenantId, String query, Pageable pageable) {
        return customerRepository.searchByQuery(tenantId, query, pageable);
    }
    
    public Optional<Customer> findById(UUID tenantId, UUID id) {
        return customerRepository.findByIdAndTenantId(id, tenantId);
    }
    
    public Optional<Customer> findByEmail(UUID tenantId, String email) {
        return customerRepository.findByEmailAndTenantId(email, tenantId);
    }
    
    @Transactional
    public Customer create(UUID tenantId, Customer customer) {
        customer.setTenantId(tenantId);
        customer.setReferralCode(generateReferralCode());
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());
        return customerRepository.save(customer);
    }
    
    @Transactional
    public Customer update(UUID tenantId, UUID id, Customer updated) {
        return customerRepository.findByIdAndTenantId(id, tenantId)
            .map(existing -> {
                existing.setName(updated.getName());
                existing.setEmail(updated.getEmail());
                existing.setPhone(updated.getPhone());
                existing.setDocumentNumber(updated.getDocumentNumber());
                existing.setAddress(updated.getAddress());
                existing.setBirthDate(updated.getBirthDate());
                existing.setNotes(updated.getNotes());
                existing.setEmailOptIn(updated.getEmailOptIn());
                existing.setSmsOptIn(updated.getSmsOptIn());
                existing.setWhatsappOptIn(updated.getWhatsappOptIn());
                return customerRepository.save(existing);
            })
            .orElseThrow(() -> new RuntimeException("Customer not found"));
    }
    
    @Transactional
    public void delete(UUID tenantId, UUID id) {
        customerRepository.findByIdAndTenantId(id, tenantId)
            .ifPresent(customerRepository::delete);
    }
    
    // ========== Loyalty & Points ==========
    
    @Transactional
    public Customer addPoints(UUID customerId, int points, String description, UUID userId) {
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        customer.setLoyaltyPoints(customer.getLoyaltyPoints() + points);
        updateLoyaltyTier(customer);
        
        // Log interaction
        logInteraction(customer, CustomerInteraction.InteractionType.LOYALTY_POINTS, 
            "+" + points + " puntos", description, userId);
        
        return customerRepository.save(customer);
    }
    
    @Transactional
    public Customer redeemPoints(UUID customerId, int points, String rewardName, UUID userId) {
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        if (customer.getLoyaltyPoints() < points) {
            throw new RuntimeException("Insufficient points");
        }
        
        customer.setLoyaltyPoints(customer.getLoyaltyPoints() - points);
        
        // Log interaction
        logInteraction(customer, CustomerInteraction.InteractionType.REWARD_REDEEMED, 
            "Canje: " + rewardName, "-" + points + " puntos", userId);
        
        return customerRepository.save(customer);
    }
    
    private void updateLoyaltyTier(Customer customer) {
        int points = customer.getLoyaltyPoints();
        if (points >= 10000) {
            customer.setLoyaltyTier(LoyaltyTier.PLATINUM);
        } else if (points >= 5000) {
            customer.setLoyaltyTier(LoyaltyTier.GOLD);
        } else if (points >= 1000) {
            customer.setLoyaltyTier(LoyaltyTier.SILVER);
        } else {
            customer.setLoyaltyTier(LoyaltyTier.BRONZE);
        }
    }
    
    // ========== Purchase Tracking ==========
    
    @Transactional
    public void recordPurchase(UUID customerId, BigDecimal amount, String saleId, UUID userId) {
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        customer.setTotalPurchases(customer.getTotalPurchases() + 1);
        customer.setTotalSpent(customer.getTotalSpent().add(amount));
        customer.setAverageTicket(customer.getTotalSpent()
            .divide(BigDecimal.valueOf(customer.getTotalPurchases()), 2, RoundingMode.HALF_UP));
        customer.setLastPurchaseDate(LocalDate.now());
        
        if (customer.getFirstPurchaseDate() == null) {
            customer.setFirstPurchaseDate(LocalDate.now());
        }
        
        // Calculate CLV (simple: avg ticket * frequency * lifespan)
        updateCLV(customer);
        updateSegment(customer);
        
        // Add points (1 point per $100 spent)
        int pointsEarned = amount.divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN).intValue();
        if (pointsEarned > 0) {
            customer.setLoyaltyPoints(customer.getLoyaltyPoints() + pointsEarned);
            updateLoyaltyTier(customer);
        }
        
        // Log interaction
        logInteraction(customer, CustomerInteraction.InteractionType.PURCHASE, 
            "Compra $" + amount, saleId, userId);
        
        customerRepository.save(customer);
    }
    
    private void updateCLV(Customer customer) {
        // Simple CLV calculation: total spent + predicted future value
        // Predicted = avg ticket * monthly frequency * 12 months
        if (customer.getFirstPurchaseDate() != null) {
            long daysSinceFirst = customer.getFirstPurchaseDate().until(LocalDate.now()).getDays();
            if (daysSinceFirst > 30 && customer.getTotalPurchases() > 1) {
                double monthlyFrequency = (double) customer.getTotalPurchases() / (daysSinceFirst / 30.0);
                BigDecimal predictedYearly = customer.getAverageTicket()
                    .multiply(BigDecimal.valueOf(monthlyFrequency * 12));
                customer.setClv(customer.getTotalSpent().add(predictedYearly));
            } else {
                customer.setClv(customer.getTotalSpent().multiply(BigDecimal.valueOf(2))); // 2x for new customers
            }
        }
    }
    
    // ========== Segmentation ==========
    
    public void updateSegment(Customer customer) {
        LocalDate now = LocalDate.now();
        LocalDate lastPurchase = customer.getLastPurchaseDate();
        
        if (lastPurchase == null) {
            customer.setSegment(CustomerSegment.NEW);
            return;
        }
        
        long daysSincePurchase = lastPurchase.until(now).getDays();
        
        if (daysSincePurchase > 180) {
            customer.setSegment(CustomerSegment.LOST);
        } else if (daysSincePurchase > 60) {
            customer.setSegment(CustomerSegment.AT_RISK);
        } else if (customer.getTotalPurchases() <= 1) {
            customer.setSegment(CustomerSegment.NEW);
        } else if (customer.getClv().compareTo(BigDecimal.valueOf(500000)) > 0) {
            customer.setSegment(CustomerSegment.VIP);
        } else {
            customer.setSegment(CustomerSegment.REGULAR);
        }
    }
    
    @Transactional
    public void updateAllSegments(UUID tenantId) {
        customerRepository.findByTenantId(tenantId, Pageable.unpaged()).forEach(customer -> {
            updateSegment(customer);
            customerRepository.save(customer);
        });
    }
    
    // ========== Customer Scoring ==========
    
    public int calculateScore(Customer customer) {
        int score = 0;
        
        // Recency (0-30 points)
        if (customer.getLastPurchaseDate() != null) {
            long daysSince = customer.getLastPurchaseDate().until(LocalDate.now()).getDays();
            if (daysSince <= 7) score += 30;
            else if (daysSince <= 30) score += 20;
            else if (daysSince <= 60) score += 10;
        }
        
        // Frequency (0-30 points)
        if (customer.getTotalPurchases() >= 20) score += 30;
        else if (customer.getTotalPurchases() >= 10) score += 20;
        else if (customer.getTotalPurchases() >= 5) score += 10;
        
        // Monetary (0-30 points)
        if (customer.getTotalSpent().compareTo(BigDecimal.valueOf(1000000)) >= 0) score += 30;
        else if (customer.getTotalSpent().compareTo(BigDecimal.valueOf(500000)) >= 0) score += 20;
        else if (customer.getTotalSpent().compareTo(BigDecimal.valueOf(100000)) >= 0) score += 10;
        
        // Engagement (0-10 points)
        if (customer.getEmailOptIn()) score += 5;
        if (customer.getWhatsappOptIn()) score += 5;
        
        return Math.min(score, 100);
    }
    
    // ========== Tags ==========
    
    @Transactional
    public Customer addTag(UUID customerId, String tagName, String color) {
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        CustomerTag tag = CustomerTag.builder()
            .customer(customer)
            .name(tagName)
            .color(color)
            .build();
        
        customer.getTags().add(tag);
        return customerRepository.save(customer);
    }
    
    @Transactional
    public Customer removeTag(UUID customerId, UUID tagId) {
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        customer.getTags().removeIf(tag -> tag.getId().equals(tagId));
        return customerRepository.save(customer);
    }
    
    // ========== Timeline / Interactions ==========
    
    public List<CustomerInteraction> getTimeline(UUID customerId) {
        return interactionRepository.findTop10ByCustomerIdOrderByCreatedAtDesc(customerId);
    }
    
    @Transactional
    public void logInteraction(Customer customer, CustomerInteraction.InteractionType type, 
                                String title, String description, UUID userId) {
        CustomerInteraction interaction = CustomerInteraction.builder()
            .customer(customer)
            .type(type)
            .title(title)
            .description(description)
            .createdBy(userId)
            .build();
        
        interactionRepository.save(interaction);
    }
    
    // ========== Helpers ==========
    
    public List<Customer> findBirthdaysToday(UUID tenantId) {
        LocalDate today = LocalDate.now();
        return customerRepository.findBirthdaysToday(tenantId, today.getMonthValue(), today.getDayOfMonth());
    }
    
    public List<Customer> findAtRiskCustomers(UUID tenantId) {
        return customerRepository.findAtRiskCustomers(tenantId, LocalDate.now().minusDays(60));
    }
    
    public Map<String, Object> getStats(UUID tenantId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCustomers", customerRepository.countByTenantId(tenantId));
        stats.put("averageCLV", customerRepository.averageCLV(tenantId));
        stats.put("segmentBreakdown", customerRepository.countBySegment(tenantId));
        return stats;
    }
    
    private String generateReferralCode() {
        return "REF" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
