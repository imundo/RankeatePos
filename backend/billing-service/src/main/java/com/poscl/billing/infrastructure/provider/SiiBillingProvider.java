package com.poscl.billing.infrastructure.provider;

import com.poscl.billing.domain.entity.BillingConfig;
import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.enums.EstadoDte;
import com.poscl.billing.domain.port.BillingProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SiiBillingProvider implements BillingProvider {

    // In the future, inject SiiService, SignerService, etc.
    // private final SiiService siiService;

    @Override
    public Dte emitir(Dte dte, BillingConfig config) {
        log.info("SII PROVIDER: Iniciando proceso para DTE {}", dte.getFolio());

        // TODO: Implement actual connection
        // 1. Generate XML
        // 2. Sign XML
        // 3. Send to SII

        log.warn("SII PROVIDER: Conexión real no implementada. Simulando PENDIENTE.");

        // Return as pending or failed until fully implemented
        dte.setEstado(EstadoDte.PENDIENTE);
        dte.setGlosaEstado("Pendiente de implementación de firma digital");

        return dte;
    }

    @Override
    public Dte firmar(Dte dte, BillingConfig config) {
        log.warn("SII PROVIDER: Firmando DTE (Simulado/Pendiente de Implementación)");
        // TODO: Use SignerService to sign XML
        // For now, assume it's done or placeholder
        dte.setXmlContent("<xml>Placeholder Sii Content</xml>");
        dte.setXmlFirmado("<xml>Placeholder Sii Signed</xml>");
        return dte;
    }

    @Override
    public BillingConfig.Country getCountry() {
        return BillingConfig.Country.CHILE;
    }
}
