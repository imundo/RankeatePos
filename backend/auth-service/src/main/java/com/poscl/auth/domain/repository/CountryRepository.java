package com.poscl.auth.domain.repository;

import com.poscl.auth.domain.entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CountryRepository extends JpaRepository<Country, UUID> {
    Optional<Country> findByIsoCode(String isoCode);
}
