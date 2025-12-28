package com.poscl.marketing.domain.repository;

import com.poscl.marketing.domain.entity.Customer;
import com.poscl.marketing.domain.entity.Customer.CustomerSegment;
import com.poscl.marketing.domain.entity.Customer.LoyaltyTier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    
    Page<Customer> findByTenantId(UUID tenantId, Pageable pageable);
    
    Optional<Customer> findByIdAndTenantId(UUID id, UUID tenantId);
    
    Optional<Customer> findByEmailAndTenantId(String email, UUID tenantId);
    
    Optional<Customer> findByReferralCode(String referralCode);
    
    List<Customer> findByTenantIdAndSegment(UUID tenantId, CustomerSegment segment);
    
    List<Customer> findByTenantIdAndLoyaltyTier(UUID tenantId, LoyaltyTier tier);
    
    @Query("SELECT c FROM Customer c WHERE c.tenantId = :tenantId AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "c.phone LIKE CONCAT('%', :query, '%'))")
    Page<Customer> searchByQuery(@Param("tenantId") UUID tenantId, 
                                  @Param("query") String query, 
                                  Pageable pageable);
    
    @Query("SELECT c FROM Customer c WHERE c.tenantId = :tenantId AND c.birthDate IS NOT NULL " +
           "AND EXTRACT(MONTH FROM c.birthDate) = :month AND EXTRACT(DAY FROM c.birthDate) = :day")
    List<Customer> findBirthdaysToday(@Param("tenantId") UUID tenantId, 
                                       @Param("month") int month, 
                                       @Param("day") int day);
    
    @Query("SELECT c FROM Customer c WHERE c.tenantId = :tenantId " +
           "AND c.lastPurchaseDate < :beforeDate AND c.segment != 'LOST'")
    List<Customer> findAtRiskCustomers(@Param("tenantId") UUID tenantId, 
                                        @Param("beforeDate") LocalDate beforeDate);
    
    @Query("SELECT c FROM Customer c WHERE c.tenantId = :tenantId AND c.emailOptIn = true")
    List<Customer> findEmailOptedIn(@Param("tenantId") UUID tenantId);
    
    @Query("SELECT COUNT(c) FROM Customer c WHERE c.tenantId = :tenantId")
    long countByTenantId(@Param("tenantId") UUID tenantId);
    
    @Query("SELECT c.segment, COUNT(c) FROM Customer c WHERE c.tenantId = :tenantId GROUP BY c.segment")
    List<Object[]> countBySegment(@Param("tenantId") UUID tenantId);
    
    @Query("SELECT AVG(c.clv) FROM Customer c WHERE c.tenantId = :tenantId")
    Double averageCLV(@Param("tenantId") UUID tenantId);
}
