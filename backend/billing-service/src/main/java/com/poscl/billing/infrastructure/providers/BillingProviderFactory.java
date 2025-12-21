package com.poscl.billing.infrastructure.providers;

import com.poscl.billing.domain.enums.Pais;
import com.poscl.shared.exception.BusinessConflictException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Factory para obtener el BillingProvider correcto según el país
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BillingProviderFactory {

    private final Map<Pais, BillingProvider> providersByPais;

    public BillingProviderFactory(List<BillingProvider> providers) {
        this.providersByPais = providers.stream()
                .collect(Collectors.toMap(
                        BillingProvider::getPais,
                        Function.identity()
                ));
        log.info("Billing providers registrados: {}", providersByPais.keySet());
    }

    /**
     * Obtener provider para un país
     */
    public BillingProvider getProvider(Pais pais) {
        BillingProvider provider = providersByPais.get(pais);
        if (provider == null) {
            throw new BusinessConflictException("PAIS_NO_SOPORTADO",
                    "No hay soporte de facturación electrónica para " + pais.getNombre());
        }
        return provider;
    }

    /**
     * Verificar si un país está soportado
     */
    public boolean isSupported(Pais pais) {
        return providersByPais.containsKey(pais);
    }

    /**
     * Listar países soportados
     */
    public List<Pais> getPaisesSoportados() {
        return List.copyOf(providersByPais.keySet());
    }
}
