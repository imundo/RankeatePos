package com.poscl.billing.domain.entity;

import com.poscl.billing.domain.enums.EstadoDte;
import com.poscl.billing.domain.enums.TipoDte;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Documento Tributario Electrónico emitido
 */
@Entity
@Table(name = "dte", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "tenant_id", "tipo_dte", "folio" })
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Dte {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    // --- Identificación DTE ---
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_dte", nullable = false)
    private TipoDte tipoDte;

    @Column(nullable = false)
    private Integer folio;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDate fechaEmision;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento;

    // --- Emisor ---
    @Column(name = "emisor_rut", nullable = false, length = 12)
    private String emisorRut;

    @Column(name = "emisor_razon_social", nullable = false, length = 100)
    private String emisorRazonSocial;

    @Column(name = "emisor_giro", length = 80)
    private String emisorGiro;

    @Column(name = "emisor_direccion", length = 70)
    private String emisorDireccion;

    @Column(name = "emisor_comuna", length = 20)
    private String emisorComuna;

    @Column(name = "emisor_ciudad", length = 20)
    private String emisorCiudad;

    // --- Receptor ---
    @Column(name = "receptor_rut", length = 12)
    private String receptorRut;

    @Column(name = "receptor_razon_social", length = 100)
    private String receptorRazonSocial;

    @Column(name = "receptor_giro", length = 80)
    private String receptorGiro;

    @Column(name = "receptor_direccion", length = 70)
    private String receptorDireccion;

    @Column(name = "receptor_comuna", length = 20)
    private String receptorComuna;

    @Column(name = "receptor_ciudad", length = 20)
    private String receptorCiudad;

    @Column(name = "receptor_email", length = 80)
    private String receptorEmail;

    // --- Montos ---
    @Column(name = "monto_neto", precision = 18, scale = 2)
    private BigDecimal montoNeto;

    @Column(name = "monto_exento", precision = 18, scale = 2)
    private BigDecimal montoExento;

    @Column(name = "tasa_iva")
    private Integer tasaIva;

    @Column(name = "monto_iva", precision = 18, scale = 2)
    private BigDecimal montoIva;

    @Column(name = "monto_total", nullable = false, precision = 18, scale = 2)
    private BigDecimal montoTotal;

    // --- Estado SII ---
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EstadoDte estado = EstadoDte.BORRADOR;

    @Column(name = "anu lacion_motivo", length = 200)
    private String anulacionMotivo;

    @Column(name = "anulada_at")
    private Instant anuladaAt;

    @Column(name = "anulada_por")
    private UUID anuladaPor;

    @Column(name = "track_id", length = 20)
    private String trackId;

    @Column(name = "glosa_estado", length = 500)
    private String glosaEstado;

    @Column(name = "fecha_envio")
    private Instant fechaEnvio;

    @Column(name = "fecha_respuesta")
    private Instant fechaRespuesta;

    // --- Archivos ---
    @Column(name = "xml_content", columnDefinition = "TEXT")
    private String xmlContent;

    @Column(name = "xml_firmado", columnDefinition = "TEXT")
    private String xmlFirmado;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Column(name = "timbre_ted", columnDefinition = "TEXT")
    private String timbreTed;

    // --- Referencia a venta original ---
    @Column(name = "venta_id")
    private UUID ventaId;

    // --- Referencias a otros DTEs (para notas de crédito/débito) ---
    @Column(name = "dte_referencia_id")
    private UUID dteReferenciaId;

    @Column(name = "tipo_referencia")
    private String tipoReferencia;

    @Column(name = "razon_referencia", length = 90)
    private String razonReferencia;

    // --- Detalle de items ---
    @OneToMany(mappedBy = "dte", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DteDetalle> detalles = new ArrayList<>();

    // --- Auditoría ---
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    // --- Métodos helper ---
    public void addDetalle(DteDetalle detalle) {
        detalles.add(detalle);
        detalle.setDte(this);
    }

    public void removeDetalle(DteDetalle detalle) {
        detalles.remove(detalle);
        detalle.setDte(null);
    }

    public String getCodigoTipoDte() {
        return String.valueOf(tipoDte.getCodigo());
    }

    public boolean isEnviado() {
        return estado != EstadoDte.BORRADOR && estado != EstadoDte.PENDIENTE;
    }

    public boolean isAceptado() {
        return estado == EstadoDte.ACEPTADO || estado == EstadoDte.ACEPTADO_CON_REPAROS;
    }

    // --- Alias methods for consistency ---
    public BigDecimal getNeto() {
        return montoNeto;
    }

    public void setNeto(BigDecimal neto) {
        this.montoNeto = neto;
    }

    public BigDecimal getExento() {
        return montoExento;
    }

    public void setExento(BigDecimal exento) {
        this.montoExento = exento;
    }

    public BigDecimal getIva() {
        return montoIva;
    }

    public void setIva(BigDecimal iva) {
        this.montoIva = iva;
    }

    public BigDecimal getTotal() {
        return montoTotal;
    }

    public void setTotal(BigDecimal total) {
        this.montoTotal = total;
    }
}
