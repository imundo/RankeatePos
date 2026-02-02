package com.poscl.billing.domain.repository;

import com.poscl.billing.domain.enums.TipoDte;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Proyección ligera de CAF para listados
 */
public interface CafSummary {
    UUID getId();

    UUID getTenantId();

    TipoDte getTipoDte();

    Integer getFolioDesde();

    Integer getFolioHasta();

    Integer getFolioActual();

    LocalDate getFechaAutorizacion();

    LocalDate getFechaVencimiento();

    Boolean getActivo();

    Boolean getAgotado();

    // Calculated methods can be simulated or handled in service mapper
    // But Spring Data Projections work best with getters matching property names
}
