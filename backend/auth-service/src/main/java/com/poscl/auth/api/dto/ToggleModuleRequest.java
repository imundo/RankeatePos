package com.poscl.auth.api.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToggleModuleRequest {
    private String moduleCode;
    private Boolean enabled;
}
