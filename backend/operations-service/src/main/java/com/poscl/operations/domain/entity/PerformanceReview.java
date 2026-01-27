package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "performance_reviews")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceReview {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String period; // e.g., "2024-Q1", "2024-ANNUAL"

    private LocalDate reviewDate;

    private String reviewerName; // Or link to User ID if available

    private Integer overallScore; // 0-100

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(columnDefinition = "TEXT")
    private String goals; // JSON or simple text for now

    private String status; // DRAFT, COMPLETED, ACKNOWLEDGED

    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
