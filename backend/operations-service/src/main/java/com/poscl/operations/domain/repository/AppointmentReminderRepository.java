package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.AppointmentReminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AppointmentReminderRepository extends JpaRepository<AppointmentReminder, UUID> {

    List<AppointmentReminder> findByAppointmentIdOrderByCreatedAtDesc(UUID appointmentId);

    List<AppointmentReminder> findByEstado(String estado);
}
