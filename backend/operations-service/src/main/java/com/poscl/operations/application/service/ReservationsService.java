package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.Reservation;
import com.poscl.operations.domain.entity.RestaurantTable;
import com.poscl.operations.domain.repository.ReservationRepository;
import com.poscl.operations.domain.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReservationsService {

    private final ReservationRepository reservationRepository;
    private final RestaurantTableRepository tableRepository;

    // ==================== RESERVATIONS ====================

    public List<Reservation> getReservationsForDate(UUID tenantId, LocalDate date) {
        return reservationRepository.findByTenantIdAndFechaOrderByHoraAsc(tenantId, date);
    }

    public List<Reservation> getReservationsForDateAndBranch(UUID tenantId, UUID branchId, LocalDate date) {
        return reservationRepository.findByTenantIdAndBranchIdAndFechaOrderByHoraAsc(tenantId, branchId, date);
    }

    public Optional<Reservation> getReservationById(UUID id) {
        return reservationRepository.findById(id);
    }

    @Transactional
    public Reservation createReservation(UUID tenantId, UUID branchId, String clienteNombre, 
                                         String clienteTelefono, LocalDate fecha, LocalTime hora, 
                                         int personas, UUID tableId, String notas) {
        
        Reservation reservation = Reservation.builder()
                .tenantId(tenantId)
                .branchId(branchId)
                .clienteNombre(clienteNombre)
                .clienteTelefono(clienteTelefono)
                .fecha(fecha)
                .hora(hora)
                .personas(personas)
                .notas(notas)
                .build();

        if (tableId != null) {
            RestaurantTable table = tableRepository.findById(tableId).orElse(null);
            if (table != null) {
                reservation.setTable(table);
            }
        }

        log.info("Creating reservation for {} on {} at {}", clienteNombre, fecha, hora);
        return reservationRepository.save(reservation);
    }

    @Transactional
    public Reservation updateStatus(UUID reservationId, String newStatus) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found: " + reservationId));

        switch (newStatus.toUpperCase()) {
            case "CONFIRMADA" -> reservation.confirm();
            case "EN_CURSO" -> reservation.start();
            case "COMPLETADA" -> reservation.complete();
            case "CANCELADA" -> reservation.cancel();
            case "NO_SHOW" -> reservation.markNoShow();
            default -> reservation.setEstado(newStatus);
        }

        log.info("Updated reservation {} status to {}", reservationId, newStatus);
        return reservationRepository.save(reservation);
    }

    @Transactional
    public Reservation assignTable(UUID reservationId, UUID tableId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found: " + reservationId));
        
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found: " + tableId));

        reservation.setTable(table);
        return reservationRepository.save(reservation);
    }

    // ==================== TABLES ====================

    public List<RestaurantTable> getTables(UUID tenantId, UUID branchId) {
        return tableRepository.findByTenantIdAndBranchIdAndActivoOrderByNumeroAsc(tenantId, branchId, true);
    }

    public List<RestaurantTable> getAvailableTables(UUID tenantId, UUID branchId, int minCapacity) {
        return tableRepository.findByTenantIdAndBranchIdAndCapacidadGreaterThanEqualAndEstado(
                tenantId, branchId, minCapacity, "DISPONIBLE");
    }

    @Transactional
    public RestaurantTable updateTableStatus(UUID tableId, String newStatus) {
        RestaurantTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found: " + tableId));

        switch (newStatus.toUpperCase()) {
            case "DISPONIBLE" -> table.release();
            case "OCUPADA" -> table.occupy();
            case "RESERVADA" -> table.reserve();
            default -> table.setEstado(newStatus);
        }

        log.info("Updated table {} status to {}", table.getNumero(), newStatus);
        return tableRepository.save(table);
    }

    // ==================== STATS ====================

    public ReservationStats getStats(UUID tenantId, LocalDate date) {
        Long total = reservationRepository.countByTenantIdAndFechaAndEstadoIn(
                tenantId, date, Arrays.asList("PENDIENTE", "CONFIRMADA", "EN_CURSO", "COMPLETADA"));
        Long confirmadas = reservationRepository.countByTenantIdAndFechaAndEstadoIn(
                tenantId, date, Arrays.asList("CONFIRMADA", "EN_CURSO"));

        return new ReservationStats(
                total != null ? total : 0,
                confirmadas != null ? confirmadas : 0
        );
    }

    public record ReservationStats(long totalReservas, long confirmadas) {}
}
