package com.poscl.payroll.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "employees", indexes = {
    @Index(name = "idx_employee_tenant", columnList = "tenant_id"),
    @Index(name = "idx_employee_rut", columnList = "rut")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 20)
    private String rut;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(length = 100)
    private String email;

    @Column(length = 50)
    private String phone;

    @Column(length = 300)
    private String address;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "hire_date", nullable = false)
    private LocalDate hireDate;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", length = 30)
    private ContractType contractType;

    @Column(length = 100)
    private String position;

    @Column(length = 100)
    private String department;

    @Column(name = "base_salary", precision = 18, scale = 2)
    private BigDecimal baseSalary;

    // Datos Previred/AFP
    @Column(name = "afp_code", length = 10)
    private String afpCode;

    @Column(name = "health_insurance_code", length = 10)
    private String healthInsuranceCode; // FONASA o ISAPRE

    @Column(name = "health_plan_uf", precision = 10, scale = 4)
    private BigDecimal healthPlanUf; // Si es ISAPRE

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public String getFullName() {
        return this.firstName + " " + this.lastName;
    }

    public enum ContractType {
        INDEFINIDO,     // Contrato indefinido
        PLAZO_FIJO,     // Plazo fijo
        POR_OBRA,       // Por obra o faena
        HONORARIOS      // Boleta de honorarios
    }
}
