package com.poscl.billing.domain.repository;

import com.poscl.billing.domain.entity.TaxRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaxRuleRepository extends JpaRepository<TaxRule, UUID> {
    List<TaxRule> findByCountryIsoCode(String countryIsoCode);
    Optional<TaxRule> findByCountryIsoCodeAndCode(String countryIsoCode, String code);
    List<TaxRule> findByCountryIsoCodeAndIsDefaultTrue(String countryIsoCode);
}
