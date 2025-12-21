package com.poscl.billing.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Tipos de Documentos Tributarios Electrónicos según SII Chile
 */
@Getter
@RequiredArgsConstructor
public enum TipoDte {
    FACTURA_ELECTRONICA(33, "Factura Electrónica"),
    FACTURA_EXENTA(34, "Factura No Afecta o Exenta Electrónica"),
    BOLETA_ELECTRONICA(39, "Boleta Electrónica"),
    BOLETA_EXENTA(41, "Boleta Exenta Electrónica"),
    GUIA_DESPACHO(52, "Guía de Despacho Electrónica"),
    NOTA_DEBITO(56, "Nota de Débito Electrónica"),
    NOTA_CREDITO(61, "Nota de Crédito Electrónica");

    private final int codigo;
    private final String descripcion;

    public static TipoDte fromCodigo(int codigo) {
        for (TipoDte tipo : values()) {
            if (tipo.getCodigo() == codigo) {
                return tipo;
            }
        }
        throw new IllegalArgumentException("Código de DTE no válido: " + codigo);
    }
}
