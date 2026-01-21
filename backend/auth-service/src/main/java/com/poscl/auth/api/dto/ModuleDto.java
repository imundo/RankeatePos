package com.poscl.auth.api.dto;

import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleDto {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private String icon;
    private String category;
    private Integer sortOrder;
    private Boolean active;
}
