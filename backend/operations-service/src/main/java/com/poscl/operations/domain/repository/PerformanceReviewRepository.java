package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.PerformanceReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, UUID> {
    List<PerformanceReview> findByEmployeeId(UUID employeeId);

    List<PerformanceReview> findByTenantId(UUID tenantId);
}
