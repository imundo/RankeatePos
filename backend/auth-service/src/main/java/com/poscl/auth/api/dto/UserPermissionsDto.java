package com.poscl.auth.api.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissionsDto {
    private UUID userId;
    private List<ModuleAccessDto> modules;
}
