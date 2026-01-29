package com.poscl.sales.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Invoice {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id")
    private Sale sale;

    @Column(nullable = false)
    private Integer folio; // SII Folio number

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceType type; // BOLETA, FACTURA

    @Column(nullable = false)
    private LocalDateTime emissionDate;

    // Client Data Snapshot
    private String clientRut;
    private String clientName;
    private String clientAddress;
    private String clientGiro;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    private BigDecimal netAmount;
    private BigDecimal taxAmount; // IVA 19%
    private BigDecimal totalAmount;

    private String siiTrackId; // For integration tracking

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.ISSUED;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum InvoiceType {
        BOLETA, FACTURA, NOTA_CREDITO, NOTA_DEBITO
    }

    public enum InvoiceStatus {
        ISSUED, ACCEPTED_SII, REJECTED_SII, CANCELLED
    }
}
