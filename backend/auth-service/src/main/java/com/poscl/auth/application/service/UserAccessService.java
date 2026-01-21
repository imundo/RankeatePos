package com.poscl.auth.application.service;

import com.poscl.auth.domain.entity.Module;
import com.poscl.auth.domain.entity.UserModuleAccess;
import com.poscl.auth.domain.repository.ModuleRepository;
import com.poscl.auth.domain.repository.UserModuleAccessRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserAccessService {

    private final UserModuleAccessRepository accessRepository;
    private final ModuleRepository moduleRepository;

    /**
     * Get all module access for a user
     */
    public List<UserModuleAccess> getUserModules(UUID userId) {
        return accessRepository.findByUserIdWithModule(userId);
    }

    /**
     * Get enabled module codes for a user
     */
    public List<String> getEnabledModuleCodes(UUID userId) {
        return accessRepository.findEnabledModuleCodesByUserId(userId);
    }

    /**
     * Check if user has access to a specific module
     */
    public boolean hasAccess(UUID userId, String moduleCode) {
        return moduleRepository.findByCode(moduleCode)
                .map(module -> accessRepository.existsByUserIdAndModuleIdAndEnabledTrue(userId, module.getId()))
                .orElse(false);
    }

    /**
     * Toggle a single module for a user
     */
    @Transactional
    public UserModuleAccess toggleModule(UUID userId, UUID moduleId, boolean enabled, UUID grantedBy) {
        log.info("Toggling module {} for user {} to {}", moduleId, userId, enabled);

        Optional<UserModuleAccess> existing = accessRepository.findByUserIdAndModuleId(userId, moduleId);

        if (existing.isPresent()) {
            UserModuleAccess access = existing.get();
            access.setEnabled(enabled);
            access.setUpdatedAt(Instant.now());
            return accessRepository.save(access);
        } else {
            UserModuleAccess access = UserModuleAccess.builder()
                    .userId(userId)
                    .moduleId(moduleId)
                    .enabled(enabled)
                    .grantedAt(Instant.now())
                    .grantedBy(grantedBy)
                    .build();
            return accessRepository.save(access);
        }
    }

    /**
     * Bulk update modules for a user
     */
    @Transactional
    public List<UserModuleAccess> updateUserModules(UUID userId, Map<UUID, Boolean> moduleStates, UUID grantedBy) {
        log.info("Bulk updating {} modules for user {}", moduleStates.size(), userId);

        List<UserModuleAccess> results = new ArrayList<>();

        for (Map.Entry<UUID, Boolean> entry : moduleStates.entrySet()) {
            results.add(toggleModule(userId, entry.getKey(), entry.getValue(), grantedBy));
        }

        return results;
    }

    /**
     * Grant all modules from a list to a user
     */
    @Transactional
    public void grantModules(UUID userId, List<String> moduleCodes, UUID grantedBy) {
        List<Module> modules = moduleRepository.findByCodeIn(moduleCodes);

        for (Module module : modules) {
            if (!accessRepository.findByUserIdAndModuleId(userId, module.getId()).isPresent()) {
                UserModuleAccess access = UserModuleAccess.builder()
                        .userId(userId)
                        .moduleId(module.getId())
                        .enabled(true)
                        .grantedAt(Instant.now())
                        .grantedBy(grantedBy)
                        .build();
                accessRepository.save(access);
            }
        }
    }

    /**
     * Apply a preset template (e.g., "Cajero", "Bodeguero", "Admin")
     */
    @Transactional
    public List<UserModuleAccess> applyPreset(UUID userId, String presetName, UUID grantedBy) {
        log.info("Applying preset {} to user {}", presetName, userId);

        List<String> moduleCodes;

        switch (presetName.toUpperCase()) {
            case "CAJERO":
                moduleCodes = Arrays.asList("pos", "products", "customers");
                break;
            case "BODEGUERO":
                moduleCodes = Arrays.asList("products", "inventory");
                break;
            case "ENCARGADO":
                moduleCodes = Arrays.asList("pos", "products", "inventory", "customers", "reports");
                break;
            case "ADMIN":
                moduleCodes = Arrays.asList("pos", "products", "inventory", "customers", "reservations",
                        "marketing", "reports", "users", "settings");
                break;
            case "FULL":
                return grantAllModules(userId, grantedBy);
            default:
                throw new IllegalArgumentException("Unknown preset: " + presetName);
        }

        // First disable all
        accessRepository.findByUserId(userId).forEach(access -> {
            access.setEnabled(false);
            accessRepository.save(access);
        });

        // Then enable preset modules
        grantModules(userId, moduleCodes, grantedBy);

        return accessRepository.findByUserIdWithModule(userId);
    }

    /**
     * Grant all active modules to a user
     */
    @Transactional
    public List<UserModuleAccess> grantAllModules(UUID userId, UUID grantedBy) {
        List<Module> allModules = moduleRepository.findByActiveTrueOrderBySortOrderAsc();

        for (Module module : allModules) {
            toggleModule(userId, module.getId(), true, grantedBy);
        }

        return accessRepository.findByUserIdWithModule(userId);
    }

    /**
     * Revoke all modules from a user
     */
    @Transactional
    public void revokeAllModules(UUID userId) {
        accessRepository.deleteByUserId(userId);
    }

    /**
     * Copy permissions from one user to another
     */
    @Transactional
    public List<UserModuleAccess> copyPermissions(UUID sourceUserId, UUID targetUserId, UUID grantedBy) {
        log.info("Copying permissions from {} to {}", sourceUserId, targetUserId);

        List<UserModuleAccess> sourceAccess = accessRepository.findByUserId(sourceUserId);

        for (UserModuleAccess source : sourceAccess) {
            toggleModule(targetUserId, source.getModuleId(), source.getEnabled(), grantedBy);
        }

        return accessRepository.findByUserIdWithModule(targetUserId);
    }
}
