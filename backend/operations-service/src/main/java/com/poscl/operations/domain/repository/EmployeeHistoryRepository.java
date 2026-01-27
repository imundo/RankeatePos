package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.EmployeeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeHistoryRepository extends JpaRepository<EmployeeHistory, UUID> {
    List<EmployeeHistory> findByEmployeeIdOrderByEventDateDesc(UUID employeeId);

    List<EmployeeHistory> findByEmployeeIdAndEventType(UUID employeeId, EmployeeHistory.EventType eventType);
}
