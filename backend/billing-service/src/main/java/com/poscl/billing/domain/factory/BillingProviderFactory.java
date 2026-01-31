package com.poscl.billing.domain.factory;

import com.poscl.billing.domain.entity.BillingConfig;
import com.poscl.billing.domain.port.BillingProvider;
import com.poscl.billing.infrastructure.provider.MockBillingProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BillingProviderFactory {

    private final List<BillingProvider> providers;
    private final MockBillingProvider mockProvider;

    public BillingProvider getProvider(BillingConfig config) {
        if (config == null || !config.isActive()) {
            return mockProvider;
        }

        return providers.stream()
                .filter(p -> p.getCountry() == config.getCountry())
                .findFirst()
                .orElse(mockProvider); // Fallback to mock if country not found
    }
}
