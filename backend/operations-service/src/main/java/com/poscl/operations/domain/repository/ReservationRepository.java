package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {

        List<Reservation> findByTenantIdAndFechaOrderByHoraAsc(UUID tenantId, LocalDate fecha);

        List<Reservation> findByTenantIdAndBranchIdAndFechaOrderByHoraAsc(
                        UUID tenantId, UUID branchId, LocalDate fecha);

        List<Reservation> findByTenantIdAndEstadoAndFechaBetween(
                        UUID tenantId, String estado, LocalDate start, LocalDate end);

        List<Reservation> findByTableIdAndFechaAndEstadoIn(
                        UUID tableId, LocalDate fecha, List<String> estados);

        Long countByTenantIdAndFechaAndEstadoIn(UUID tenantId, LocalDate fecha, List<String> estados);

        // Methods for AutomationScheduler
        List<Reservation> findByFechaAndEstado(LocalDate fecha, String estado);

        List<Reservation> findByFechaAndHoraBetweenAndEstado(LocalDate fecha, java.time.LocalTime startTime,
                        java.time.LocalTime endTime, String estado);
}
