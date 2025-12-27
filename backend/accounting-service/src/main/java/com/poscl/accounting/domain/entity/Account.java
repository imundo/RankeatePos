package com.poscl.accounting.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Representa una cuenta del Plan de Cuentas contable.
 * Estructura jerárquica: Activo > Activo Corriente > Caja > Caja General
 */
@Entity
@Table(name = "accounts", indexes = {
    @Index(name = "idx_account_tenant_code", columnList = "tenant_id, code"),
    @Index(name = "idx_account_parent", columnList = "parent_id")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 20)
    private String code; // Ej: "1.1.1.01"

    @Column(nullable = false, length = 200)
    private String name; // Ej: "Caja General"

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountType type; // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountNature nature; // DEBIT, CREDIT

    @Column(nullable = false)
    @Builder.Default
    private Integer level = 1; // Nivel en jerarquía (1=clase, 2=grupo, 3=cuenta, 4=subcuenta)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Account parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Account> children = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean allowsMovements = true; // false para cuentas de agrupación

    @Column(nullable = false)
    @Builder.Default
    private Boolean isSystemAccount = false; // true para cuentas del plan base

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Tipos de cuenta según plan contable chileno
    public enum AccountType {
        ASSET,      // Activo
        LIABILITY,  // Pasivo
        EQUITY,     // Patrimonio
        INCOME,     // Ingresos
        EXPENSE,    // Gastos
        COST        // Costos
    }

    // Naturaleza de la cuenta (saldo normal)
    public enum AccountNature {
        DEBIT,  // Saldo deudor (Activo, Gastos, Costos)
        CREDIT  // Saldo acreedor (Pasivo, Patrimonio, Ingresos)
    }
}
