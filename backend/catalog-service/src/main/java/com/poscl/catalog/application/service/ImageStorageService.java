package com.poscl.catalog.application.service;

import com.poscl.catalog.domain.entity.UploadedImage;
import com.poscl.catalog.domain.repository.UploadedImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageStorageService {

    private final UploadedImageRepository uploadedImageRepository;

    @Transactional
    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Fallo al guardar archivo vacío.");
        }

        // Obtener extensión original
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String extension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            extension = originalFileName.substring(i);
        }

        // Generar nuevo nombre seguro con UUID
        String newFileName = UUID.randomUUID().toString() + extension;

        try {
            // Verificar tamaño (ej: 1MB máximo)
            if (file.getSize() > 1_048_576) { // 1MB en bytes
                throw new RuntimeException("El archivo excede el límite de 1MB permitido.");
            }

            UploadedImage uploadedImage = UploadedImage.builder()
                    .fileName(newFileName)
                    .contentType(file.getContentType())
                    .data(file.getBytes())
                    .build();

            uploadedImageRepository.save(uploadedImage);

            return newFileName;
        } catch (IOException ex) {
            log.error("Error guardando el archivo físico.", ex);
            throw new RuntimeException("No se pudo guardar el archivo: " + ex.getMessage(), ex);
        }
    }

    @Transactional(readOnly = true)
    public UploadedImage getFile(String fileName) {
        return uploadedImageRepository.findByFileName(fileName)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado: " + fileName));
    }
}
