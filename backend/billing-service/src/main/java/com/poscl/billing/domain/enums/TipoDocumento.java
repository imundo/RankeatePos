package com.poscl.billing.domain.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.List;

/**
 * Tipos de documentos tributarios unificados multi-país
 */
@Getter
@RequiredArgsConstructor
public enum TipoDocumento {
    // Documentos comunes
    FACTURA("FAC", "Factura"),
    BOLETA("BOL", "Boleta"),
    NOTA_CREDITO("NC", "Nota de Crédito"),
    NOTA_DEBITO("ND", "Nota de Débito"),
    GUIA_DESPACHO("GD", "Guía de Despacho");

    private final String codigo;
    private final String descripcion;

    // Códigos SII Chile
    public Integer getCodigoSii() {
        return switch (this) {
            case FACTURA -> 33;
            case BOLETA -> 39;
            case NOTA_CREDITO -> 61;
            case NOTA_DEBITO -> 56;
            case GUIA_DESPACHO -> 52;
        };
    }

    // Códigos SUNAT Perú
    public String getCodigoSunat() {
        return switch (this) {
            case FACTURA -> "01";
            case BOLETA -> "03";
            case NOTA_CREDITO -> "07";
            case NOTA_DEBITO -> "08";
            case GUIA_DESPACHO -> "09";
        };
    }

    // Códigos SENIAT Venezuela
    public String getCodigoSeniat() {
        return switch (this) {
            case FACTURA -> "FAC";
            case BOLETA -> "FAC"; // Venezuela no tiene boleta, usa factura
            case NOTA_CREDITO -> "NC";
            case NOTA_DEBITO -> "ND";
            case GUIA_DESPACHO -> "GD";
        };
    }

    /**
     * Obtener tipos de documento disponibles por país
     */
    public static List<TipoDocumento> getByPais(Pais pais) {
        return switch (pais) {
            case CL -> Arrays.asList(FACTURA, BOLETA, NOTA_CREDITO, NOTA_DEBITO, GUIA_DESPACHO);
            case PE -> Arrays.asList(FACTURA, BOLETA, NOTA_CREDITO, NOTA_DEBITO);
            case VE -> Arrays.asList(FACTURA, NOTA_CREDITO, NOTA_DEBITO); // Solo e-commerce
        };
    }

    /**
     * Convertir desde código específico del país
     */
    public static TipoDocumento fromCodigoPais(Pais pais, String codigo) {
        return switch (pais) {
            case CL -> fromCodigoSii(Integer.parseInt(codigo));
            case PE -> fromCodigoSunat(codigo);
            case VE -> fromCodigoSeniat(codigo);
        };
    }

    private static TipoDocumento fromCodigoSii(int codigo) {
        for (TipoDocumento tipo : values()) {
            if (tipo.getCodigoSii().equals(codigo)) {
                return tipo;
            }
        }
        throw new IllegalArgumentException("Código SII no válido: " + codigo);
    }

    private static TipoDocumento fromCodigoSunat(String codigo) {
        for (TipoDocumento tipo : values()) {
            if (tipo.getCodigoSunat().equals(codigo)) {
                return tipo;
            }
        }
        throw new IllegalArgumentException("Código SUNAT no válido: " + codigo);
    }

    private static TipoDocumento fromCodigoSeniat(String codigo) {
        for (TipoDocumento tipo : values()) {
            if (tipo.getCodigoSeniat().equals(codigo)) {
                return tipo;
            }
        }
        throw new IllegalArgumentException("Código SENIAT no válido: " + codigo);
    }
}
