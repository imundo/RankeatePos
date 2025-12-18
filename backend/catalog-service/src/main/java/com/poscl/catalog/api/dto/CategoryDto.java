package com.poscl.catalog.api.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * Response de categoría
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    
    private UUID id;
    private String nombre;
    private String descripcion;
    private UUID parentId;
    private String parentName;
    private Integer orden;
    private Boolean activa;
    private List<CategoryDto> children;
}
