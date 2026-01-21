package com.poscl.auth.domain.repository;

import com.poscl.auth.domain.entity.UserModuleAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserModuleAccessRepository extends JpaRepository<UserModuleAccess, UUID> {

    List<UserModuleAccess> findByUserId(UUID userId);

    List<UserModuleAccess> findByUserIdAndEnabledTrue(UUID userId);

    Optional<UserModuleAccess> findByUserIdAndModuleId(UUID userId, UUID moduleId);

    @Query("SELECT uma FROM UserModuleAccess uma JOIN FETCH uma.module WHERE uma.userId = :userId")
    List<UserModuleAccess> findByUserIdWithModule(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE UserModuleAccess uma SET uma.enabled = :enabled WHERE uma.userId = :userId AND uma.moduleId = :moduleId")
    int updateEnabled(@Param("userId") UUID userId, @Param("moduleId") UUID moduleId,
            @Param("enabled") Boolean enabled);

    @Modifying
    @Query("DELETE FROM UserModuleAccess uma WHERE uma.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    @Query("SELECT uma.module.code FROM UserModuleAccess uma WHERE uma.userId = :userId AND uma.enabled = true")
    List<String> findEnabledModuleCodesByUserId(@Param("userId") UUID userId);

    boolean existsByUserIdAndModuleIdAndEnabledTrue(UUID userId, UUID moduleId);
}
