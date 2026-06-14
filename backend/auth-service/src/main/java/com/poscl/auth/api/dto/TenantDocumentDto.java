package com.poscl.auth.api.dto;

import java.time.LocalDate;
import java.util.UUID;

public record TenantDocumentDto(
        UUID id,
        String nombre,
        String tipo,
        LocalDate fechaVencimiento,
        String archivoUrl,
        String estado
) {}
