package com.poscl.billing.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Países soportados para facturación electrónica
 */
@Getter
@RequiredArgsConstructor
public enum Pais {
    CL("Chile", "SII", "Servicio de Impuestos Internos"),
    PE("Perú", "SUNAT", "Superintendencia Nacional de Aduanas y de Administración Tributaria"),
    VE("Venezuela", "SENIAT", "Servicio Nacional Integrado de Administración Aduanera y Tributaria");

    private final String nombre;
    private final String autoridadCodigo;
    private final String autoridadNombre;

    public static Pais fromCodigo(String codigo) {
        for (Pais pais : values()) {
            if (pais.name().equalsIgnoreCase(codigo)) {
                return pais;
            }
        }
        throw new IllegalArgumentException("Código de país no soportado: " + codigo);
    }
}
