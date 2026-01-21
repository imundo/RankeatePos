package com.poscl.auth.domain.repository;

import com.poscl.auth.domain.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlanRepository extends JpaRepository<Plan, UUID> {

    Optional<Plan> findByCode(String code);

    List<Plan> findByActiveTrueAndIsPublicTrueOrderBySortOrderAsc();

    List<Plan> findByActiveTrueOrderBySortOrderAsc();

    boolean existsByCode(String code);
}
