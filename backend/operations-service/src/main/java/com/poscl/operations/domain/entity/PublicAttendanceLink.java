package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Public attendance links for employees to clock in/out.
 * Permanent links with statistics tracking.
 */
@Entity
@Table(name = "public_attendance_links")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicAttendanceLink {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    private UUID branchId;

    @Column(nullable = false, unique = true)
    private String token; // Short unique code for URL

    private String name; // "Link Sucursal Centro"
    private String description;

    @Builder.Default
    private boolean active = true;

    // Deactivation info
    private Instant deactivatedAt;
    private String deactivatedBy;
    private String deactivationReason;

    // Statistics
    @Builder.Default
    private long totalClockIns = 0;

    @Builder.Default
    private long totalClockOuts = 0;

    private LocalDate lastUsedDate;
    private Instant lastUsedAt;

    private String createdBy;
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        if (token == null) {
            // Generate a short readable token
            token = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
    }

    /**
     * Increment clock-in counter
     */
    public void recordClockIn() {
        this.totalClockIns++;
        this.lastUsedDate = LocalDate.now();
        this.lastUsedAt = Instant.now();
    }

    /**
     * Increment clock-out counter
     */
    public void recordClockOut() {
        this.totalClockOuts++;
        this.lastUsedDate = LocalDate.now();
        this.lastUsedAt = Instant.now();
    }

    /**
     * Deactivate the link
     */
    public void deactivate(String deactivatedBy, String reason) {
        this.active = false;
        this.deactivatedAt = Instant.now();
        this.deactivatedBy = deactivatedBy;
        this.deactivationReason = reason;
    }
}
