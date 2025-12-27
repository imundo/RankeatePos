package com.poscl.payroll.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "payslips", indexes = {
    @Index(name = "idx_payslip_period", columnList = "payroll_period_id"),
    @Index(name = "idx_payslip_employee", columnList = "employee_id")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Payslip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_period_id", nullable = false)
    private PayrollPeriod payrollPeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "days_worked")
    @Builder.Default
    private Integer daysWorked = 30;

    // Haberes
    @Column(name = "base_salary", precision = 18, scale = 2)
    private BigDecimal baseSalary;

    @Column(name = "overtime_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal overtimeAmount = BigDecimal.ZERO;

    @Column(name = "bonus_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal bonusAmount = BigDecimal.ZERO;

    @Column(name = "commission_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal commissionAmount = BigDecimal.ZERO;

    @Column(name = "other_income", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal otherIncome = BigDecimal.ZERO;

    @Column(name = "gross_salary", precision = 18, scale = 2)
    private BigDecimal grossSalary;

    // Descuentos legales
    @Column(name = "afp_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal afpAmount = BigDecimal.ZERO;

    @Column(name = "health_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal healthAmount = BigDecimal.ZERO;

    @Column(name = "unemployment_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal unemploymentAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "other_deductions", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal otherDeductions = BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 18, scale = 2)
    private BigDecimal totalDeductions;

    @Column(name = "net_salary", precision = 18, scale = 2)
    private BigDecimal netSalary;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public void calculateTotals() {
        this.grossSalary = this.baseSalary
            .add(this.overtimeAmount)
            .add(this.bonusAmount)
            .add(this.commissionAmount)
            .add(this.otherIncome);

        this.totalDeductions = this.afpAmount
            .add(this.healthAmount)
            .add(this.unemploymentAmount)
            .add(this.taxAmount)
            .add(this.otherDeductions);

        this.netSalary = this.grossSalary.subtract(this.totalDeductions);
    }
}
