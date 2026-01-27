package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Employment history events for an employee.
 * Tracks promotions, salary changes, position changes, etc.
 */
@Entity
@Table(name = "employee_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    private EventType eventType;

    private String description;
    private String previousValue;
    private String newValue;

    private String recordedBy;
    private Instant eventDate;
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        if (eventDate == null) {
            eventDate = Instant.now();
        }
    }

    public enum EventType {
        HIRED,
        PROMOTION,
        SALARY_CHANGE,
        POSITION_CHANGE,
        DEPARTMENT_CHANGE,
        CONTRACT_RENEWAL,
        WARNING,
        SUSPENSION,
        TERMINATED,
        REHIRED,
        NOTE
    }
}
