package com.poscl.operations.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "payroll_details")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_id", nullable = false)
    private Payroll payroll;

    @Column(nullable = false)
    private String conceptCode; // BASE, AFP, HEALTH, BONUS_X

    @Column(nullable = false)
    private String conceptName;

    @Column(nullable = false)
    private String conceptType; // INCOME, DEDUCTION, INFORMATION

    private BigDecimal amount;
    private BigDecimal rate; // 0.10 for 10%

    private Integer sortOrder;
}
