package com.poscl.catalog.api.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * Response de producto
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {

    private UUID id;
    private String sku;
    private String nombre;
    private String descripcion;
    private UUID categoryId;
    private String categoryName;
    private UUID unitId;
    private String unitCode;
    private Boolean activo;
    private Boolean requiereVariantes;
    private Boolean permiteVentaFraccionada;
    private String imagenUrl;

    private List<VariantDto> variants;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantDto {
        private UUID id;
        private String sku;
        private String nombre;
        private String barcode;
        private Integer costo;
        private Integer precioNeto;
        private Integer precioBruto;
        private UUID taxId;
        private Integer taxPercentage;
        private Integer stockMinimo;
        private Integer stockMaximo;
        private Integer stock; // Current stock from inventory-service
        private Boolean activo;
        private Boolean esDefault;
        private Double marginPercentage;
        private Integer marginAbsolute;
    }
}
