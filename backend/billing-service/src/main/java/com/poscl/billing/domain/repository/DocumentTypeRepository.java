package com.poscl.billing.domain.repository;

import com.poscl.billing.domain.entity.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentTypeRepository extends JpaRepository<DocumentType, UUID> {
    List<DocumentType> findByCountryIsoCode(String countryIsoCode);
    Optional<DocumentType> findByCountryIsoCodeAndCode(String countryIsoCode, String code);
}
