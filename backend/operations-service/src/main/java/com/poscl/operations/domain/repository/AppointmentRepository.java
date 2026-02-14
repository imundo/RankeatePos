package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    Page<Appointment> findByTenantIdOrderByFechaDescHoraInicioDesc(UUID tenantId, Pageable pageable);

    List<Appointment> findByTenantIdAndFechaOrderByHoraInicio(UUID tenantId, LocalDate fecha);

    List<Appointment> findByTenantIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(
            UUID tenantId, LocalDate fechaStart, LocalDate fechaEnd);

    List<Appointment> findByTenantIdAndStaffIdAndFechaOrderByHoraInicio(
            UUID tenantId, UUID staffId, LocalDate fecha);

    List<Appointment> findByTenantIdAndCustomerIdOrderByFechaDescHoraInicioDesc(UUID tenantId, UUID customerId);

    @Query("SELECT a FROM Appointment a WHERE a.tenantId = :tenantId AND a.branchId = :branchId " +
            "AND a.fecha = :fecha ORDER BY a.horaInicio")
    List<Appointment> findByBranchAndFecha(
            @Param("tenantId") UUID tenantId,
            @Param("branchId") UUID branchId,
            @Param("fecha") LocalDate fecha);

    @Query("SELECT a FROM Appointment a WHERE a.tenantId = :tenantId " +
            "AND a.staffId = :staffId AND a.fecha = :fecha " +
            "AND a.estado NOT IN ('CANCELADA','NO_SHOW') " +
            "AND ((a.horaInicio < :horaFin AND a.horaFin > :horaInicio))")
    List<Appointment> findConflicts(
            @Param("tenantId") UUID tenantId,
            @Param("staffId") UUID staffId,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin);

    @Query("SELECT a FROM Appointment a WHERE a.tenantId = :tenantId " +
            "AND a.estado = :estado ORDER BY a.fecha, a.horaInicio")
    List<Appointment> findByEstado(
            @Param("tenantId") UUID tenantId,
            @Param("estado") String estado);

    @Query("SELECT a FROM Appointment a WHERE a.fecha = :fecha " +
            "AND a.estado IN ('PROGRAMADA','CONFIRMADA') " +
            "AND a.recordatorioEnviado = false")
    List<Appointment> findPendingReminders(@Param("fecha") LocalDate fecha);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.tenantId = :tenantId AND a.estado = :estado")
    long countByEstado(@Param("tenantId") UUID tenantId, @Param("estado") String estado);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.tenantId = :tenantId " +
            "AND a.fecha BETWEEN :start AND :end")
    long countByPeriod(
            @Param("tenantId") UUID tenantId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT a.staffNombre, COUNT(a) as cnt FROM Appointment a " +
            "WHERE a.tenantId = :tenantId AND a.fecha BETWEEN :start AND :end " +
            "AND a.estado NOT IN ('CANCELADA') " +
            "GROUP BY a.staffNombre ORDER BY cnt DESC")
    List<Object[]> getStaffStats(
            @Param("tenantId") UUID tenantId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);
}
