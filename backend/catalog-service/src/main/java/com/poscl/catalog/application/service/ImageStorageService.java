package com.poscl.catalog.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class ImageStorageService {

    private final Path fileStorageLocation;
    private static final String UPLOAD_DIR = "uploads/products";

    public ImageStorageService() {
        this.fileStorageLocation = Paths.get(UPLOAD_DIR)
                .toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("Directorio de uploads creado en: {}", this.fileStorageLocation);
        } catch (Exception ex) {
            log.error("No se pudo crear el directorio donde se subirán los archivos.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Fallo al guardar archivo vacío.");
        }

        // Obtener extensión original
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            extension = originalFileName.substring(i);
        }

        // Generar nuevo nombre seguro con UUID
        String newFileName = UUID.randomUUID().toString() + extension;

        try {
            // Verificar tamaño (ej: 1MB máximo se puede forzar aquí o en controller)
            if (file.getSize() > 1_048_576) { // 1MB en bytes
                throw new RuntimeException("El archivo excede el límite de 1MB permitido.");
            }

            // Copy file to the target location (Replacing existing file with the same name)
            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return newFileName;
        } catch (IOException ex) {
            throw new RuntimeException("No se pudo guardar el archivo " + newFileName + ". Por favor intenta nuevamente!", ex);
        }
    }
}
