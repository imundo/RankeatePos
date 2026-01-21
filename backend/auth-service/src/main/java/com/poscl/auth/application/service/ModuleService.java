package com.poscl.auth.application.service;

import com.poscl.auth.domain.entity.Module;
import com.poscl.auth.domain.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ModuleService {

    private final ModuleRepository moduleRepository;

    public List<Module> findAll() {
        return moduleRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    public List<Module> findByCategory(String category) {
        return moduleRepository.findByCategoryAndActiveTrueOrderBySortOrderAsc(category);
    }

    public Optional<Module> findByCode(String code) {
        return moduleRepository.findByCode(code);
    }

    public Optional<Module> findById(UUID id) {
        return moduleRepository.findById(id);
    }

    public List<String> findCategories() {
        return moduleRepository.findDistinctCategories();
    }

    public Map<String, List<Module>> findAllGroupedByCategory() {
        return findAll().stream()
                .collect(Collectors.groupingBy(Module::getCategory));
    }

    public List<Module> findByCodes(List<String> codes) {
        return moduleRepository.findByCodeIn(codes);
    }

    @Transactional
    public Module create(Module module) {
        log.info("Creating module: {}", module.getCode());
        return moduleRepository.save(module);
    }

    @Transactional
    public Module update(UUID id, Module moduleData) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        if (moduleData.getName() != null)
            module.setName(moduleData.getName());
        if (moduleData.getDescription() != null)
            module.setDescription(moduleData.getDescription());
        if (moduleData.getIcon() != null)
            module.setIcon(moduleData.getIcon());
        if (moduleData.getCategory() != null)
            module.setCategory(moduleData.getCategory());
        if (moduleData.getSortOrder() != null)
            module.setSortOrder(moduleData.getSortOrder());
        if (moduleData.getActive() != null)
            module.setActive(moduleData.getActive());

        return moduleRepository.save(module);
    }

    @Transactional
    public void delete(UUID id) {
        moduleRepository.deleteById(id);
    }
}
