package com.poscl.operations.application.service;

import com.poscl.operations.domain.entity.*;
import com.poscl.operations.domain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ServiceCatalogRepository serviceCatalogRepository;
    private final StaffAvailabilityRepository staffAvailabilityRepository;
    private final StaffBlockRepository staffBlockRepository;
    private final AppointmentReminderRepository reminderRepository;

    // ==================== APPOINTMENTS CRUD ====================

    public Page<Appointment> findAll(UUID tenantId, Pageable pageable) {
        return appointmentRepository.findByTenantIdOrderByFechaDescHoraInicioDesc(tenantId, pageable);
    }

    public Optional<Appointment> findById(UUID id) {
        return appointmentRepository.findById(id);
    }

    public List<Appointment> findByDate(UUID tenantId, LocalDate fecha) {
        return appointmentRepository.findByTenantIdAndFechaOrderByHoraInicio(tenantId, fecha);
    }

    public List<Appointment> findByDateRange(UUID tenantId, LocalDate start, LocalDate end) {
        return appointmentRepository.findByTenantIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(tenantId, start, end);
    }

    public List<Appointment> findByStaffAndDate(UUID tenantId, UUID staffId, LocalDate fecha) {
        return appointmentRepository.findByTenantIdAndStaffIdAndFechaOrderByHoraInicio(tenantId, staffId, fecha);
    }

    public List<Appointment> findByCustomer(UUID tenantId, UUID customerId) {
        return appointmentRepository.findByTenantIdAndCustomerIdOrderByFechaDescHoraInicioDesc(tenantId, customerId);
    }

    @Transactional
    public Appointment create(UUID tenantId, Appointment appointment) {
        appointment.setTenantId(tenantId);

        // Default: calculate end time from service duration
        if (appointment.getHoraFin() == null && appointment.getService() != null) {
            ServiceCatalog service = appointment.getService();
            appointment.setHoraFin(appointment.getHoraInicio().plusMinutes(service.getDuracionMinutos()));
            appointment.setServiceNombre(service.getNombre());
            if (appointment.getPrecioEstimado() == null && service.getPrecio() != null) {
                appointment.setPrecioEstimado(service.getPrecio());
            }
            if (appointment.getColor() == null) {
                appointment.setColor(service.getColor());
            }
        }

        // Default for hora_fin if not set
        if (appointment.getHoraFin() == null) {
            appointment.setHoraFin(appointment.getHoraInicio().plusMinutes(60));
        }

        // Check for conflicts
        if (appointment.getStaffId() != null) {
            List<Appointment> conflicts = appointmentRepository.findConflicts(
                    tenantId, appointment.getStaffId(),
                    appointment.getFecha(), appointment.getHoraInicio(), appointment.getHoraFin());

            if (!conflicts.isEmpty()) {
                throw new IllegalStateException(
                        "Conflicto de horario: el profesional ya tiene " + conflicts.size() +
                                " cita(s) en ese horario");
            }
        }

        log.info("Creating appointment for tenant={}, date={}, time={}-{}, staff={}",
                tenantId, appointment.getFecha(), appointment.getHoraInicio(),
                appointment.getHoraFin(), appointment.getStaffNombre());

        return appointmentRepository.save(appointment);
    }

    @Transactional
    public Appointment update(UUID tenantId, UUID id, Appointment updated) {
        Appointment existing = appointmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Cita no encontrada: " + id));

        if (!existing.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Acceso denegado");
        }

        // Update fields
        if (updated.getCustomerNombre() != null)
            existing.setCustomerNombre(updated.getCustomerNombre());
        if (updated.getCustomerTelefono() != null)
            existing.setCustomerTelefono(updated.getCustomerTelefono());
        if (updated.getCustomerEmail() != null)
            existing.setCustomerEmail(updated.getCustomerEmail());
        if (updated.getStaffId() != null)
            existing.setStaffId(updated.getStaffId());
        if (updated.getStaffNombre() != null)
            existing.setStaffNombre(updated.getStaffNombre());
        if (updated.getNotas() != null)
            existing.setNotas(updated.getNotas());
        if (updated.getNotasInternas() != null)
            existing.setNotasInternas(updated.getNotasInternas());
        if (updated.getPrecioEstimado() != null)
            existing.setPrecioEstimado(updated.getPrecioEstimado());

        // Schedule change? Re-validate conflicts
        if (updated.getFecha() != null || updated.getHoraInicio() != null) {
            LocalDate fecha = updated.getFecha() != null ? updated.getFecha() : existing.getFecha();
            LocalTime horaInicio = updated.getHoraInicio() != null ? updated.getHoraInicio() : existing.getHoraInicio();
            LocalTime horaFin = updated.getHoraFin() != null ? updated.getHoraFin() : existing.getHoraFin();
            UUID staffId = updated.getStaffId() != null ? updated.getStaffId() : existing.getStaffId();

            existing.setFecha(fecha);
            existing.setHoraInicio(horaInicio);
            existing.setHoraFin(horaFin);

            if (staffId != null) {
                List<Appointment> conflicts = appointmentRepository
                        .findConflicts(tenantId, staffId, fecha, horaInicio, horaFin)
                        .stream().filter(c -> !c.getId().equals(id)).collect(Collectors.toList());
                if (!conflicts.isEmpty()) {
                    throw new IllegalStateException("Conflicto de horario al reprogramar");
                }
            }
        }

        return appointmentRepository.save(existing);
    }

    @Transactional
    public Appointment updateStatus(UUID tenantId, UUID id, String newStatus, BigDecimal precioFinal) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Cita no encontrada: " + id));

        if (!appointment.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Acceso denegado");
        }

        switch (newStatus.toUpperCase()) {
            case "CONFIRMADA":
                appointment.confirm();
                break;
            case "EN_PROGRESO":
                appointment.start();
                break;
            case "COMPLETADA":
                appointment.complete(precioFinal);
                break;
            case "CANCELADA":
                appointment.cancel();
                break;
            case "NO_SHOW":
                appointment.markNoShow();
                break;
            default:
                appointment.setEstado(newStatus);
        }

        log.info("Appointment {} status changed to {}", id, newStatus);
        return appointmentRepository.save(appointment);
    }

    @Transactional
    public Appointment reschedule(UUID tenantId, UUID id, LocalDate newFecha, LocalTime newHoraInicio,
            LocalTime newHoraFin) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Cita no encontrada: " + id));

        if (!appointment.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Acceso denegado");
        }

        // Check conflicts for new time
        if (appointment.getStaffId() != null) {
            List<Appointment> conflicts = appointmentRepository.findConflicts(tenantId, appointment.getStaffId(),
                    newFecha, newHoraInicio, newHoraFin)
                    .stream().filter(c -> !c.getId().equals(id)).collect(Collectors.toList());
            if (!conflicts.isEmpty()) {
                throw new IllegalStateException("Conflicto de horario al reprogramar");
            }
        }

        appointment.reschedule(newFecha, newHoraInicio, newHoraFin);
        appointment.setRecordatorioEnviado(false); // Reset reminder
        return appointmentRepository.save(appointment);
    }

    public void delete(UUID tenantId, UUID id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Cita no encontrada: " + id));
        if (!appointment.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Acceso denegado");
        }
        appointmentRepository.delete(appointment);
    }

    // ==================== AVAILABLE SLOTS ====================

    public List<Map<String, Object>> getAvailableSlots(UUID tenantId, LocalDate fecha, UUID serviceId, UUID staffId) {
        List<Map<String, Object>> slots = new ArrayList<>();

        // Get service duration
        int duracionMinutos = 60;
        if (serviceId != null) {
            ServiceCatalog service = serviceCatalogRepository.findById(serviceId).orElse(null);
            if (service != null)
                duracionMinutos = service.getDuracionMinutos();
        }

        int dayOfWeek = fecha.getDayOfWeek().getValue() % 7; // Convert to 0=SUN, 6=SAT

        // Get staff availability for that day
        List<StaffAvailability> availabilities;
        if (staffId != null) {
            availabilities = staffAvailabilityRepository.findByTenantIdAndStaffIdAndDiaSemanaAndActivoTrue(
                    tenantId, staffId, dayOfWeek);
        } else {
            availabilities = staffAvailabilityRepository.findByTenantIdAndDiaSemanaAndActivoTrue(
                    tenantId, dayOfWeek);
        }

        // For each available staff member, generate time slots
        for (StaffAvailability avail : availabilities) {
            UUID currentStaffId = avail.getStaffId();

            // Check if staff is blocked (vacation, holiday, etc.)
            LocalDateTime blockCheckTime = fecha.atTime(avail.getHoraInicio());
            List<StaffBlock> blocks = staffBlockRepository.findActiveBlocks(tenantId, currentStaffId, blockCheckTime);
            if (!blocks.isEmpty())
                continue;

            // Get existing appointments for this staff
            List<Appointment> existingAppointments = appointmentRepository
                    .findByTenantIdAndStaffIdAndFechaOrderByHoraInicio(tenantId, currentStaffId, fecha)
                    .stream()
                    .filter(a -> !a.getEstado().equals("CANCELADA") && !a.getEstado().equals("NO_SHOW"))
                    .collect(Collectors.toList());

            // Generate slots in the available window
            LocalTime slotStart = avail.getHoraInicio();
            while (slotStart.plusMinutes(duracionMinutos).isBefore(avail.getHoraFin()) ||
                    slotStart.plusMinutes(duracionMinutos).equals(avail.getHoraFin())) {

                LocalTime slotEnd = slotStart.plusMinutes(duracionMinutos);

                // Check if slot conflicts with existing appointments
                final LocalTime checkStart = slotStart;
                final LocalTime checkEnd = slotEnd;
                boolean occupied = existingAppointments.stream().anyMatch(
                        apt -> checkStart.isBefore(apt.getHoraFin()) && apt.getHoraInicio().isBefore(checkEnd));

                Map<String, Object> slot = new HashMap<>();
                slot.put("horaInicio", slotStart.toString());
                slot.put("horaFin", slotEnd.toString());
                slot.put("disponible", !occupied);
                slot.put("staffId", currentStaffId.toString());
                slot.put("staffNombre", avail.getStaffNombre());

                slots.add(slot);
                slotStart = slotStart.plusMinutes(30); // 30-min intervals
            }
        }

        return slots;
    }

    // ==================== SERVICE CATALOG ====================

    public List<ServiceCatalog> getServices(UUID tenantId) {
        return serviceCatalogRepository.findByTenantIdAndActivoTrueOrderByOrdenAsc(tenantId);
    }

    public List<ServiceCatalog> getAllServices(UUID tenantId) {
        return serviceCatalogRepository.findByTenantIdOrderByOrdenAsc(tenantId);
    }

    public Optional<ServiceCatalog> getService(UUID tenantId, UUID id) {
        return serviceCatalogRepository.findByIdAndTenantId(id, tenantId);
    }

    @Transactional
    public ServiceCatalog createService(UUID tenantId, ServiceCatalog service) {
        service.setTenantId(tenantId);
        return serviceCatalogRepository.save(service);
    }

    @Transactional
    public ServiceCatalog updateService(UUID tenantId, UUID id, ServiceCatalog updated) {
        ServiceCatalog existing = serviceCatalogRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NoSuchElementException("Servicio no encontrado: " + id));

        if (updated.getNombre() != null)
            existing.setNombre(updated.getNombre());
        if (updated.getDescripcion() != null)
            existing.setDescripcion(updated.getDescripcion());
        if (updated.getDuracionMinutos() != null)
            existing.setDuracionMinutos(updated.getDuracionMinutos());
        if (updated.getPrecio() != null)
            existing.setPrecio(updated.getPrecio());
        if (updated.getColor() != null)
            existing.setColor(updated.getColor());
        if (updated.getIcono() != null)
            existing.setIcono(updated.getIcono());
        if (updated.getCategoria() != null)
            existing.setCategoria(updated.getCategoria());
        if (updated.getActivo() != null)
            existing.setActivo(updated.getActivo());
        if (updated.getOrden() != null)
            existing.setOrden(updated.getOrden());
        if (updated.getRequiereProfesional() != null)
            existing.setRequiereProfesional(updated.getRequiereProfesional());

        return serviceCatalogRepository.save(existing);
    }

    public void deleteService(UUID tenantId, UUID id) {
        ServiceCatalog service = serviceCatalogRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new NoSuchElementException("Servicio no encontrado: " + id));
        serviceCatalogRepository.delete(service);
    }

    // ==================== STAFF AVAILABILITY ====================

    public List<StaffAvailability> getStaffAvailability(UUID tenantId) {
        return staffAvailabilityRepository.findByTenantIdAndActivoTrueOrderByStaffNombreAscDiaSemanaAsc(tenantId);
    }

    public List<StaffAvailability> getStaffSchedule(UUID tenantId, UUID staffId) {
        return staffAvailabilityRepository.findByTenantIdAndStaffIdAndActivoTrue(tenantId, staffId);
    }

    @Transactional
    public StaffAvailability saveAvailability(UUID tenantId, StaffAvailability availability) {
        availability.setTenantId(tenantId);
        return staffAvailabilityRepository.save(availability);
    }

    @Transactional
    public List<StaffAvailability> saveStaffSchedule(UUID tenantId, UUID staffId, List<StaffAvailability> schedule) {
        // Delete existing schedule for this staff
        staffAvailabilityRepository.deleteByTenantIdAndStaffId(tenantId, staffId);

        // Save the new schedule
        schedule.forEach(s -> {
            s.setTenantId(tenantId);
            s.setStaffId(staffId);
        });
        return staffAvailabilityRepository.saveAll(schedule);
    }

    public void deleteAvailability(UUID id) {
        staffAvailabilityRepository.deleteById(id);
    }

    // ==================== STATS / DASHBOARD ====================

    public Map<String, Object> getStats(UUID tenantId) {
        Map<String, Object> stats = new HashMap<>();

        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        stats.put("hoy", appointmentRepository.findByTenantIdAndFechaOrderByHoraInicio(tenantId, today).size());
        stats.put("programadas", appointmentRepository.countByEstado(tenantId, "PROGRAMADA"));
        stats.put("confirmadas", appointmentRepository.countByEstado(tenantId, "CONFIRMADA"));
        stats.put("completadasMes", appointmentRepository.countByEstado(tenantId, "COMPLETADA"));
        stats.put("canceladasMes", appointmentRepository.countByEstado(tenantId, "CANCELADA"));
        stats.put("noShowMes", appointmentRepository.countByEstado(tenantId, "NO_SHOW"));
        stats.put("totalMes", appointmentRepository.countByPeriod(tenantId, monthStart, monthEnd));

        // Staff performance
        List<Object[]> staffStats = appointmentRepository.getStaffStats(tenantId, monthStart, monthEnd);
        List<Map<String, Object>> staffPerformance = staffStats.stream().map(row -> {
            Map<String, Object> sp = new HashMap<>();
            sp.put("nombre", row[0]);
            sp.put("totalCitas", row[1]);
            return sp;
        }).collect(Collectors.toList());
        stats.put("staffPerformance", staffPerformance);

        return stats;
    }

    // ==================== CALENDAR VIEW ====================

    public Map<String, Object> getCalendarData(UUID tenantId, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

        List<Appointment> appointments = findByDateRange(tenantId, start, end);

        // Group by date
        Map<LocalDate, List<Appointment>> byDate = appointments.stream()
                .collect(Collectors.groupingBy(Appointment::getFecha));

        // Build calendar data
        Map<String, Object> calendar = new HashMap<>();
        calendar.put("year", year);
        calendar.put("month", month);
        calendar.put("totalAppointments", appointments.size());

        List<Map<String, Object>> days = new ArrayList<>();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            Map<String, Object> day = new HashMap<>();
            day.put("fecha", date.toString());
            List<Appointment> dayAppointments = byDate.getOrDefault(date, Collections.emptyList());
            day.put("count", dayAppointments.size());
            day.put("appointments", dayAppointments);
            days.add(day);
        }
        calendar.put("days", days);

        return calendar;
    }

    // ==================== REMINDERS ====================

    public List<AppointmentReminder> getReminders(UUID appointmentId) {
        return reminderRepository.findByAppointmentIdOrderByCreatedAtDesc(appointmentId);
    }

    @Transactional
    public AppointmentReminder createReminder(Appointment appointment, String canal, LocalDateTime fechaProgramada,
            String contenido) {
        AppointmentReminder reminder = AppointmentReminder.builder()
                .appointment(appointment)
                .canal(canal)
                .fechaProgramada(fechaProgramada)
                .contenido(contenido)
                .build();
        return reminderRepository.save(reminder);
    }

    public List<AppointmentReminder> getPendingReminders() {
        return reminderRepository.findByEstado("PENDIENTE");
    }

    // ==================== STAFF BLOCKS ====================

    public List<StaffBlock> getStaffBlocks(UUID tenantId, UUID staffId) {
        return staffBlockRepository.findByTenantIdAndStaffId(tenantId, staffId);
    }

    @Transactional
    public StaffBlock createStaffBlock(UUID tenantId, StaffBlock block) {
        block.setTenantId(tenantId);
        return staffBlockRepository.save(block);
    }

    public void deleteStaffBlock(UUID id) {
        staffBlockRepository.deleteById(id);
    }
}
