package com.poscl.operations.api.controller;

import com.poscl.operations.application.service.AppointmentService;
import com.poscl.operations.domain.entity.Appointment;
import com.poscl.operations.domain.entity.ServiceCatalog;
import com.poscl.operations.domain.entity.StaffAvailability;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "Gestión de citas y agendamiento profesional")
public class AppointmentController {

    private final AppointmentService appointmentService;

    // ==================== APPOINTMENTS CRUD ====================

    @GetMapping
    @Operation(summary = "Listar citas paginadas")
    public ResponseEntity<Page<Appointment>> getAppointments(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            Pageable pageable) {
        return ResponseEntity.ok(appointmentService.findAll(tenantId, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cita por ID")
    public ResponseEntity<Appointment> getAppointment(@PathVariable UUID id) {
        return appointmentService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/date")
    @Operation(summary = "Citas por fecha")
    public ResponseEntity<List<Appointment>> getByDate(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam LocalDate fecha) {
        return ResponseEntity.ok(appointmentService.findByDate(tenantId, fecha));
    }

    @GetMapping("/range")
    @Operation(summary = "Citas por rango de fechas")
    public ResponseEntity<List<Appointment>> getByDateRange(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(appointmentService.findByDateRange(tenantId, start, end));
    }

    @GetMapping("/staff/{staffId}")
    @Operation(summary = "Citas de un profesional por fecha")
    public ResponseEntity<List<Appointment>> getByStaff(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID staffId,
            @RequestParam LocalDate fecha) {
        return ResponseEntity.ok(appointmentService.findByStaffAndDate(tenantId, staffId, fecha));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Historial de citas de un cliente")
    public ResponseEntity<List<Appointment>> getByCustomer(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID customerId) {
        return ResponseEntity.ok(appointmentService.findByCustomer(tenantId, customerId));
    }

    @PostMapping
    @Operation(summary = "Crear nueva cita")
    public ResponseEntity<?> createAppointment(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody Appointment appointment) {
        try {
            return ResponseEntity.ok(appointmentService.create(tenantId, appointment));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar cita")
    public ResponseEntity<?> updateAppointment(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id,
            @RequestBody Appointment appointment) {
        try {
            return ResponseEntity.ok(appointmentService.update(tenantId, id, appointment));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Cambiar estado de cita")
    public ResponseEntity<?> updateStatus(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request) {
        try {
            String estado = (String) request.get("estado");
            BigDecimal precioFinal = request.containsKey("precioFinal")
                    ? new BigDecimal(request.get("precioFinal").toString())
                    : null;
            return ResponseEntity.ok(appointmentService.updateStatus(tenantId, id, estado, precioFinal));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reschedule")
    @Operation(summary = "Reprogramar cita")
    public ResponseEntity<?> reschedule(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        try {
            LocalDate newFecha = LocalDate.parse(request.get("fecha"));
            LocalTime newHoraInicio = LocalTime.parse(request.get("horaInicio"));
            LocalTime newHoraFin = LocalTime.parse(request.get("horaFin"));
            return ResponseEntity.ok(appointmentService.reschedule(tenantId, id, newFecha, newHoraInicio, newHoraFin));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cita")
    public ResponseEntity<Void> deleteAppointment(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id) {
        appointmentService.delete(tenantId, id);
        return ResponseEntity.noContent().build();
    }

    // ==================== AVAILABLE SLOTS ====================

    @GetMapping("/available-slots")
    @Operation(summary = "Obtener horarios disponibles")
    public ResponseEntity<List<Map<String, Object>>> getAvailableSlots(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam LocalDate fecha,
            @RequestParam(required = false) UUID serviceId,
            @RequestParam(required = false) UUID staffId) {
        return ResponseEntity.ok(appointmentService.getAvailableSlots(tenantId, fecha, serviceId, staffId));
    }

    // ==================== CALENDAR ====================

    @GetMapping("/calendar")
    @Operation(summary = "Datos del calendario mensual")
    public ResponseEntity<Map<String, Object>> getCalendarData(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(appointmentService.getCalendarData(tenantId, year, month));
    }

    // ==================== STATS ====================

    @GetMapping("/stats")
    @Operation(summary = "Estadísticas de citas")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(appointmentService.getStats(tenantId));
    }

    // ==================== SERVICE CATALOG ====================

    @GetMapping("/services")
    @Operation(summary = "Listar servicios activos")
    public ResponseEntity<List<ServiceCatalog>> getServices(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(appointmentService.getServices(tenantId));
    }

    @GetMapping("/services/all")
    @Operation(summary = "Listar todos los servicios (incluso inactivos)")
    public ResponseEntity<List<ServiceCatalog>> getAllServices(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(appointmentService.getAllServices(tenantId));
    }

    @GetMapping("/services/{id}")
    @Operation(summary = "Obtener servicio por ID")
    public ResponseEntity<ServiceCatalog> getService(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id) {
        return appointmentService.getService(tenantId, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/services")
    @Operation(summary = "Crear servicio")
    public ResponseEntity<ServiceCatalog> createService(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody ServiceCatalog service) {
        return ResponseEntity.ok(appointmentService.createService(tenantId, service));
    }

    @PutMapping("/services/{id}")
    @Operation(summary = "Actualizar servicio")
    public ResponseEntity<ServiceCatalog> updateService(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id,
            @RequestBody ServiceCatalog service) {
        return ResponseEntity.ok(appointmentService.updateService(tenantId, id, service));
    }

    @DeleteMapping("/services/{id}")
    @Operation(summary = "Eliminar servicio")
    public ResponseEntity<Void> deleteService(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID id) {
        appointmentService.deleteService(tenantId, id);
        return ResponseEntity.noContent().build();
    }

    // ==================== STAFF AVAILABILITY ====================

    @GetMapping("/staff-availability")
    @Operation(summary = "Disponibilidad de todo el staff")
    public ResponseEntity<List<StaffAvailability>> getStaffAvailability(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(appointmentService.getStaffAvailability(tenantId));
    }

    @GetMapping("/staff-availability/{staffId}")
    @Operation(summary = "Horario de un profesional")
    public ResponseEntity<List<StaffAvailability>> getStaffSchedule(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID staffId) {
        return ResponseEntity.ok(appointmentService.getStaffSchedule(tenantId, staffId));
    }

    @PostMapping("/staff-availability")
    @Operation(summary = "Guardar disponibilidad")
    public ResponseEntity<StaffAvailability> saveAvailability(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestBody StaffAvailability availability) {
        return ResponseEntity.ok(appointmentService.saveAvailability(tenantId, availability));
    }

    @PostMapping("/staff-availability/{staffId}/schedule")
    @Operation(summary = "Guardar horario completo de un profesional")
    public ResponseEntity<List<StaffAvailability>> saveStaffSchedule(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @PathVariable UUID staffId,
            @RequestBody List<StaffAvailability> schedule) {
        return ResponseEntity.ok(appointmentService.saveStaffSchedule(tenantId, staffId, schedule));
    }

    @DeleteMapping("/staff-availability/{id}")
    @Operation(summary = "Eliminar disponibilidad")
    public ResponseEntity<Void> deleteAvailability(@PathVariable UUID id) {
        appointmentService.deleteAvailability(id);
        return ResponseEntity.noContent().build();
    }
}
