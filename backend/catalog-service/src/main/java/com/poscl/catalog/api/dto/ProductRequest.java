package com.poscl.catalog.api.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * Request para crear/actualizar producto
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    
    @NotBlank(message = "El SKU es obligatorio")
    @Size(max = 50)
    private String sku;
    
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200)
    private String nombre;
    
    @Size(max = 2000)
    private String descripcion;
    
    private UUID categoryId;
    
    @NotNull(message = "La unidad es obligatoria")
    private UUID unitId;
    
    private Boolean requiereVariantes;
    private Boolean permiteVentaFraccionada;
    private String imagenUrl;
    
    // Variantes (al menos una)
    private List<VariantRequest> variants;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantRequest {
        
        @NotBlank(message = "El SKU de variante es obligatorio")
        @Size(max = 50)
        private String sku;
        
        @Size(max = 100)
        private String nombre;
        
        @Size(max = 50)
        private String barcode;
        
        @Min(value = 0, message = "El costo no puede ser negativo")
        private Integer costo;
        
        @NotNull(message = "El precio neto es obligatorio")
        @Min(value = 0, message = "El precio neto no puede ser negativo")
        private Integer precioNeto;
        
        @NotNull(message = "El precio bruto es obligatorio")
        @Min(value = 0, message = "El precio bruto no puede ser negativo")
        private Integer precioBruto;
        
        private UUID taxId;
        
        @Min(value = 0)
        private Integer stockMinimo;
        
        private Boolean esDefault;
    }
}
