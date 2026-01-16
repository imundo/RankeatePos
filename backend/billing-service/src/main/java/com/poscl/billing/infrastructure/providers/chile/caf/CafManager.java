package com.poscl.billing.infrastructure.providers.chile.caf;

import com.poscl.billing.domain.entity.Caf;
import com.poscl.billing.domain.repository.CafRepository;
import com.poscl.billing.domain.enums.TipoDte;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Gestor de CAF (Código de Autorización de Folios)
 * Asigna folios secuenciales y valida disponibilidad
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CafManager {

    private final CafRepository cafRepository;
    private static final int FOLIO_WARNING_THRESHOLD = 10;

    /**
     * Obtiene el siguiente folio disponible para un tipo de DTE
     * 
     * @param tenantId ID del tenant
     * @param tipoDte  Tipo de documento
     * @return Siguiente folio
     */
    public synchronized long obtenerSiguienteFolio(UUID tenantId, TipoDte tipoDte) {
        // Buscar CAF activo para este tenant y tipo
        Caf caf = cafRepository.findActiveCafByTenantAndTipo(tenantId, tipoDte)
                .orElseThrow(() -> new RuntimeException(
                        "No hay CAF activo para tipo " + tipoDte + ". Por favor cargue un CAF válido."));

        // Validar que tengamos folios disponibles
        if (caf.getFolioActual() >= caf.getFolioHasta()) {
            throw new RuntimeException(
                    "CAF agotado. Folios disponibles: 0. Por favor cargue un nuevo CAF.");
        }

        // Incrementar folio
        long siguienteFolio = caf.getFolioActual() + 1;
        caf.setFolioActual((int) siguienteFolio);

        // Calcular folios restantes
        long foliosRestantes = caf.getFolioHasta() - siguienteFolio;

        // Alertar si quedan pocos folios
        if (foliosRestantes <= FOLIO_WARNING_THRESHOLD) {
            log.warn("⚠️ Quedan solo {} folios disponibles para {} - Tenant: {}",
                    foliosRestantes, tipoDte, tenantId);
        }

        // Guardar
        cafRepository.save(caf);

        log.info("Folio asignado: {} para {} - Restantes: {}", siguienteFolio, tipoDte, foliosRestantes);

        return siguienteFolio;
    }

    /**
     * Obtiene CAF activo para tipo de documento
     */
    public Caf obtenerCafActivo(UUID tenantId, TipoDte tipoDte) {
        return cafRepository.findActiveCafByTenantAndTipo(tenantId, tipoDte)
                .orElseThrow(() -> new RuntimeException(
                        "No hay CAF configurado para " + tipoDte));
    }

    /**
     * Verifica si hay folios disponibles
     */
    public boolean hayFoliosDisponibles(UUID tenantId, TipoDte tipoDte) {
        return cafRepository.findActiveCafByTenantAndTipo(tenantId, tipoDte)
                .map(caf -> caf.getFolioActual() < caf.getFolioHasta())
                .orElse(false);
    }

    /**
     * Obtiene cantidad de folios restantes
     */
    public long getFoliosRestantes(UUID tenantId, TipoDte tipoDte) {
        return cafRepository.findActiveCafByTenantAndTipo(tenantId, tipoDte)
                .map(caf -> caf.getFolioHasta() - caf.getFolioActual())
                .orElse(0).longValue();
    }
}
