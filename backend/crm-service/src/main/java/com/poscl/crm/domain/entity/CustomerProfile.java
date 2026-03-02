package com.poscl.crm.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "customer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true)
    private String rut;

    @Column
    private String email;

    @Column
    private String phone;

    // --- Cuentas Corrientes (Fiado) ---
    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal creditLimit = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal currentDebt = BigDecimal.ZERO;

    // --- RFM Analysis (Segmentación Automática) ---
    @Column
    private LocalDateTime lastPurchaseDate; // Recency

    @Column(nullable = false)
    @Builder.Default
    private Integer purchaseCount = 0; // Frequency

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalLTV = BigDecimal.ZERO; // Monetary (Lifetime Value)

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public void addDebt(BigDecimal amount) {
        if (amount != null) {
            this.currentDebt = this.currentDebt.add(amount);
        }
    }

    public void payDebt(BigDecimal amount) {
        if (amount != null) {
            this.currentDebt = this.currentDebt.subtract(amount);
            if (this.currentDebt.compareTo(BigDecimal.ZERO) < 0) {
                this.currentDebt = BigDecimal.ZERO;
            }
        }
    }

    public boolean hasAvailableCredit(BigDecimal amount) {
        if (this.creditLimit == null || amount == null) return false;
        return this.creditLimit.subtract(this.currentDebt).compareTo(amount) >= 0;
    }

    public void recordPurchase(BigDecimal amount) {
        this.lastPurchaseDate = LocalDateTime.now();
        this.purchaseCount++;
        if (amount != null) {
            this.totalLTV = this.totalLTV.add(amount);
        }
    }
}
