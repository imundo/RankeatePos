package com.poscl.auth.domain.repository;

import com.poscl.auth.domain.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ModuleRepository extends JpaRepository<Module, UUID> {

    Optional<Module> findByCode(String code);

    List<Module> findByActiveTrueOrderBySortOrderAsc();

    List<Module> findByCategoryAndActiveTrueOrderBySortOrderAsc(String category);

    @Query("SELECT DISTINCT m.category FROM Module m WHERE m.active = true ORDER BY m.category")
    List<String> findDistinctCategories();

    List<Module> findByCodeIn(List<String> codes);

    boolean existsByCode(String code);
}
