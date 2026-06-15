package com.poscl.billing.infrastructure.provider;

import com.poscl.billing.domain.entity.BillingConfig;
import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.port.BillingProvider;
import com.poscl.billing.domain.enums.EstadoDte;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VenezuelaBillingProvider implements BillingProvider {

    @Override
    public Dte emitir(Dte dte, BillingConfig config) {
        log.info("Emitiendo DTE en SENIAT (Venezuela) para número de control {}", dte.getFolio());
        
        // TODO: Implementar lógica real de SENIAT o Máquina Fiscal
        // Por ahora, simulamos una emisión exitosa
        
        dte.setEstado(EstadoDte.ACEPTADO);
        dte.setTrackId("SENIAT-" + UUID.randomUUID().toString());
        dte.setGlosaEstado("Aceptado por SENIAT");
        return dte;
    }

    @Override
    public Dte firmar(Dte dte, BillingConfig config) {
        log.info("Procesando firma/número de control (Venezuela) para folio {}", dte.getFolio());
        // TODO: Lógica de SENIAT (ej. Providencia 0071, formas libres o integración con máquina fiscal)
        return dte;
    }

    @Override
    public BillingConfig.Country getCountry() {
        return BillingConfig.Country.VENEZUELA;
    }
}
