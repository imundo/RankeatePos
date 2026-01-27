package com.poscl.operations.domain.repository;

import com.poscl.operations.domain.entity.PublicAttendanceLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PublicAttendanceLinkRepository extends JpaRepository<PublicAttendanceLink, UUID> {
    Optional<PublicAttendanceLink> findByToken(String token);

    Optional<PublicAttendanceLink> findByTokenAndActiveTrue(String token);

    List<PublicAttendanceLink> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    List<PublicAttendanceLink> findByTenantIdAndActiveTrue(UUID tenantId);

    boolean existsByToken(String token);
}
