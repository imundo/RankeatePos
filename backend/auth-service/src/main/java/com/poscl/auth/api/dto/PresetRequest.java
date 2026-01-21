package com.poscl.auth.api.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresetRequest {
    private String preset; // CAJERO, BODEGUERO, ENCARGADO, ADMIN, FULL
}
