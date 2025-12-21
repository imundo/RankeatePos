package com.poscl.billing.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Estados de un DTE en el flujo de envío al SII
 */
@Getter
@RequiredArgsConstructor
public enum EstadoDte {
    BORRADOR("Borrador", "Documento no enviado"),
    PENDIENTE("Pendiente", "Pendiente de envío al SII"),
    ENVIADO("Enviado", "Enviado al SII, esperando respuesta"),
    ACEPTADO("Aceptado", "Aceptado por el SII"),
    ACEPTADO_CON_REPAROS("Aceptado con Reparos", "Aceptado con observaciones"),
    RECHAZADO("Rechazado", "Rechazado por el SII"),
    ANULADO("Anulado", "Documento anulado");

    private final String nombre;
    private final String descripcion;
}
