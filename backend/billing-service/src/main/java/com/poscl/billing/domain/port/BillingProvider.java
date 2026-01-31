package com.poscl.billing.domain.port;

import com.poscl.billing.api.dto.EmitirDteRequest;
import com.poscl.billing.domain.entity.BillingConfig;
import com.poscl.billing.domain.entity.Dte;

public interface BillingProvider {
    /**
     * Emite el DTE al ente fiscalizador.
     * Retorna el DTE actualizado (ej: con trackId, estado, etc).
     */
    Dte emitir(Dte dte, BillingConfig config);

    BillingConfig.Country getCountry();
}
