package com.poscl.billing.domain.repository;

import com.poscl.billing.domain.enums.EstadoDte;
import com.poscl.billing.domain.enums.TipoDte;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Proyección ligera de DTE para listados (sin XML ni binaries)
 */
public interface DteSummary {
    UUID getId();

    UUID getTenantId();

    TipoDte getTipoDte();

    Integer getFolio();

    LocalDate getFechaEmision();

    String getEmisorRut();

    String getEmisorRazonSocial();

    String getReceptorRut();

    String getReceptorRazonSocial();

    String getReceptorEmail();

    BigDecimal getMontoNeto();

    BigDecimal getMontoExento();

    BigDecimal getMontoIva();

    BigDecimal getMontoTotal();

    EstadoDte getEstado();

    String getTrackId();

    String getGlosaEstado();

    Instant getFechaEnvio();

    Instant getFechaRespuesta();

    String getPdfUrl();

    UUID getVentaId();

    UUID getDteReferenciaId();

    Instant getCreatedAt();
}
