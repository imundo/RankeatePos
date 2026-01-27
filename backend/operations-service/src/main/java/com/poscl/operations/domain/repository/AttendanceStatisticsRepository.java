package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.AttendanceStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceStatisticsRepository extends JpaRepository<AttendanceStatistics, UUID> {
    Optional<AttendanceStatistics> findByTenantIdAndEmployeeIdAndYearAndMonth(
            UUID tenantId, UUID employeeId, int year, int month);

    List<AttendanceStatistics> findByTenantIdAndYearAndMonth(UUID tenantId, int year, int month);

    List<AttendanceStatistics> findByEmployeeIdAndYearOrderByMonthAsc(UUID employeeId, int year);

    @Query("SELECT AVG(a.attendancePercentage) FROM AttendanceStatistics a WHERE a.tenantId = :tenantId AND a.year = :year AND a.month = :month")
    Double getAverageAttendanceByTenantAndPeriod(UUID tenantId, int year, int month);

    @Query("SELECT AVG(a.punctualityPercentage) FROM AttendanceStatistics a WHERE a.tenantId = :tenantId AND a.year = :year AND a.month = :month")
    Double getAveragePunctualityByTenantAndPeriod(UUID tenantId, int year, int month);
}
