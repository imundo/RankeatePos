package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    Page<LeaveRequest> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Page<LeaveRequest> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId, Pageable pageable);

    Page<LeaveRequest> findByTenantIdAndStatus(UUID tenantId, LeaveRequest.RequestStatus status, Pageable pageable);

    List<LeaveRequest> findByEmployeeIdAndStatusAndStartDateBetween(
            UUID employeeId, LeaveRequest.RequestStatus status, LocalDate startDate, LocalDate endDate);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.tenantId = :tenantId AND lr.status = 'PENDING' ORDER BY lr.createdAt ASC")
    List<LeaveRequest> findPendingByTenantId(UUID tenantId);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.id = :employeeId AND lr.type = :type AND lr.status = 'APPROVED' AND lr.startDate >= :startOfYear")
    List<LeaveRequest> findApprovedByEmployeeAndTypeAndYear(UUID employeeId, LeaveRequest.RequestType type,
            LocalDate startOfYear);

    long countByTenantIdAndStatus(UUID tenantId, LeaveRequest.RequestStatus status);
}
