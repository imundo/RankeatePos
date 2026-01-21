package com.poscl.auth.application.service;

import com.poscl.auth.domain.entity.Plan;
import com.poscl.auth.domain.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PlanService {

    private final PlanRepository planRepository;

    public List<Plan> findAllPublic() {
        return planRepository.findByActiveTrueAndIsPublicTrueOrderBySortOrderAsc();
    }

    public List<Plan> findAll() {
        return planRepository.findByActiveTrueOrderBySortOrderAsc();
    }

    public Optional<Plan> findById(UUID id) {
        return planRepository.findById(id);
    }

    public Optional<Plan> findByCode(String code) {
        return planRepository.findByCode(code);
    }

    @Transactional
    public Plan create(Plan plan) {
        log.info("Creating plan: {}", plan.getCode());
        return planRepository.save(plan);
    }

    @Transactional
    public Plan update(UUID id, Plan planData) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        if (planData.getName() != null)
            plan.setName(planData.getName());
        if (planData.getDescription() != null)
            plan.setDescription(planData.getDescription());
        if (planData.getPrice() != null)
            plan.setPrice(planData.getPrice());
        if (planData.getIncludedModules() != null)
            plan.setIncludedModules(planData.getIncludedModules());
        if (planData.getMaxUsers() != null)
            plan.setMaxUsers(planData.getMaxUsers());
        if (planData.getMaxBranches() != null)
            plan.setMaxBranches(planData.getMaxBranches());
        if (planData.getMaxProducts() != null)
            plan.setMaxProducts(planData.getMaxProducts());
        if (planData.getActive() != null)
            plan.setActive(planData.getActive());

        return planRepository.save(plan);
    }

    @Transactional
    public void delete(UUID id) {
        planRepository.deleteById(id);
    }

    public List<String> getIncludedModules(String planCode) {
        return planRepository.findByCode(planCode)
                .map(Plan::getIncludedModules)
                .orElse(List.of("pos", "products"));
    }
}
