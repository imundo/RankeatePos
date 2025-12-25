package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RewardRepository extends JpaRepository<Reward, UUID> {

    List<Reward> findByTenantIdAndActivo(UUID tenantId, Boolean activo);

    List<Reward> findByTenantIdOrderByPuntosRequeridosAsc(UUID tenantId);
}
