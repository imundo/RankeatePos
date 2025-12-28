package com.poscl.marketing.domain.repository;

import com.poscl.marketing.domain.entity.CustomerInteraction;
import com.poscl.marketing.domain.entity.CustomerInteraction.InteractionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerInteractionRepository extends JpaRepository<CustomerInteraction, UUID> {
    
    Page<CustomerInteraction> findByCustomerIdOrderByCreatedAtDesc(UUID customerId, Pageable pageable);
    
    List<CustomerInteraction> findByCustomerIdAndType(UUID customerId, InteractionType type);
    
    List<CustomerInteraction> findTop10ByCustomerIdOrderByCreatedAtDesc(UUID customerId);
}
