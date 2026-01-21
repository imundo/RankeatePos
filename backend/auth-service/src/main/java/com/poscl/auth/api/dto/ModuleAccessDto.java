package com.poscl.auth.api.dto;

import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModuleAccessDto {
    private UUID moduleId;
    private String code;
    private String name;
    private String icon;
    private String category;
    private Boolean enabled;
}
