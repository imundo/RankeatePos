package com.poscl.auth.domain.repository;

import com.poscl.auth.domain.entity.Currency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurrencyRepository extends JpaRepository<Currency, UUID> {
    Optional<Currency> findByCode(String code);
}
