package com.poscl.billing.infrastructure.provider;

import com.poscl.billing.domain.entity.BillingConfig;
import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.enums.EstadoDte;
import com.poscl.billing.domain.port.BillingProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Component
public class MockBillingProvider implements BillingProvider {

    @Override
    public Dte emitir(Dte dte, BillingConfig config) {
        log.info("MOCK PROVIDER: Simulando emisión de DTE {} para Tenant {}", dte.getFolio(), dte.getTenantId());

        // Simular latencia
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Simular respuesta exitosa
        dte.setEstado(EstadoDte.ACEPTADO); // Aceptado inmediato en Mock
        dte.setTrackId("MOCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        dte.setFechaEnvio(Instant.now());
        dte.setFechaRespuesta(Instant.now());
        dte.setGlosaEstado("Aceptado por Simulador (Mock)");

        // Simular XML y firma
        dte.setXmlContent("<xml>MockContent</xml>");
        dte.setXmlFirmado("<xml>SignedMockContent</xml>");

        log.info("MOCK PROVIDER: DTE {} aceptado con TrackId {}", dte.getFolio(), dte.getTrackId());

        return dte;
    }

    @Override
    public BillingConfig.Country getCountry() {
        return BillingConfig.Country.GENERIC_MOCK;
    }
}
