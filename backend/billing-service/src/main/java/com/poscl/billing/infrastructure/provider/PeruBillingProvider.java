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
public class PeruBillingProvider implements BillingProvider {

    @Override
    public Dte emitir(Dte dte, BillingConfig config) {
        log.info("Emitiendo DTE en SUNAT (Perú) para folio {}", dte.getFolio());
        
        // TODO: Implementar lógica real de SUNAT (API REST / WSDL)
        // Por ahora, simulamos una emisión exitosa
        
        dte.setEstado(EstadoDte.ACEPTADO);
        dte.setTrackId("SUNAT-" + UUID.randomUUID().toString());
        dte.setGlosaEstado("Aceptado por SUNAT");
        return dte;
    }

    @Override
    public Dte firmar(Dte dte, BillingConfig config) {
        log.info("Firmando DTE formato UBL (Perú) para folio {}", dte.getFolio());
        // TODO: Generar XML UBL 2.1 y firmar con certificado digital de Perú
        return dte;
    }

    @Override
    public BillingConfig.Country getCountry() {
        return BillingConfig.Country.PERU;
    }
}
