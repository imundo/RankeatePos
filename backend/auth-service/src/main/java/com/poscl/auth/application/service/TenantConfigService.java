package com.poscl.auth.application.service;

import com.poscl.auth.domain.entity.Tenant;
import com.poscl.auth.domain.entity.TenantConfig;
import com.poscl.auth.domain.repository.TenantConfigRepository;
import com.poscl.auth.domain.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TenantConfigService {

    private final TenantConfigRepository configRepository;
    private final TenantRepository tenantRepository;

    /**
     * Obtiene todas las configuraciones de un tenant
     */
    @Transactional(readOnly = true)
    public Map<String, String> getConfigs(UUID tenantId) {
        return configRepository.findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(TenantConfig::getKey, TenantConfig::getValue));
    }

    /**
     * Obtiene el valor de una configuración específica
     */
    @Transactional(readOnly = true)
    public String getConfigValue(UUID tenantId, String key, String defaultValue) {
        return configRepository.findByTenantIdAndKey(tenantId, key)
                .map(TenantConfig::getValue)
                .orElse(defaultValue);
    }

    /**
     * Actualiza o crea múltiples configuraciones
     */
    public void updateConfigs(UUID tenantId, Map<String, String> configs) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant no encontrado"));

        configs.forEach((key, value) -> {
            TenantConfig config = configRepository.findByTenantIdAndKey(tenantId, key)
                    .orElse(TenantConfig.builder()
                            .tenant(tenant)
                            .key(key)
                            .build());

            config.setValue(value);
            configRepository.save(config);
        });
    }

    /**
     * Elimina una configuración
     */
    public void deleteConfig(UUID tenantId, String key) {
        configRepository.deleteByTenantIdAndKey(tenantId, key);
    }
}
