package com.poscl.catalog.domain.repository;

import com.poscl.catalog.domain.entity.UploadedImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UploadedImageRepository extends JpaRepository<UploadedImage, UUID> {
    Optional<UploadedImage> findByFileName(String fileName);
}
