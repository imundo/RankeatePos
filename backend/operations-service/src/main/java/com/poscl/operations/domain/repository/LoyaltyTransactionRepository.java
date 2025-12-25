package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.LoyaltyTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, UUID> {

    Page<LoyaltyTransaction> findByCustomerId(UUID customerId, Pageable pageable);

    List<LoyaltyTransaction> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    List<LoyaltyTransaction> findByVentaId(UUID ventaId);

    List<LoyaltyTransaction> findByCustomerIdAndCreatedAtBetween(
            UUID customerId, LocalDateTime start, LocalDateTime end);
}
