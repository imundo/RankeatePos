package com.poscl.shared.dto;

/**
 * Rubros soportados por el sistema
 */
public enum BusinessType {

    PANADERIA("Panadería", "Venta de pan y productos de panadería"),
    CHARCUTERIA("Charcutería", "Venta de embutidos, quesos y carnes"),
    MINIMARKET("Minimarket", "Tienda de conveniencia y abarrotes"),
    VERDULERIA("Verdulería", "Venta de frutas y verduras"),
    FERRETERIA("Ferretería", "Venta de herramientas y materiales"),
    LIBRERIA("Librería", "Venta de útiles escolares y oficina"),
    FARMACIA("Farmacia", "Venta de medicamentos y productos de salud"),
    SERVICIOS("Servicios", "Servicios profesionales y consultoría"),
    EDUCACION("Educación", "Cursos, capacitaciones y formación"),
    IMPRENTA("Imprenta", "Servicios de impresión y editorial"),
    RESTAURANT("Restaurante", "Restaurante y servicios de comida"),
    BARBERIA("Barbería", "Peluquería, barbería y estética"),
    SALUD("Salud", "Consultas médicas, psicológicas y dental"),
    OTRO("Otro", "Negocio genérico");

    private final String displayName;
    private final String description;

    BusinessType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}
