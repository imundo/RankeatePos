package com.poscl.catalog.api.controller;

import com.poscl.catalog.application.service.ImageStorageService;
import com.poscl.catalog.domain.entity.UploadedImage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageUploadController {

    private final ImageStorageService imageStorageService;

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        log.info("Recibiendo solicitud de subida de imagen: {}", file.getOriginalFilename());
        
        String fileName = imageStorageService.storeFile(file);

        // La URL ahora apunta a /api/images/{fileName}
        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/images/")
                .path(fileName)
                .toUriString();

        Map<String, String> response = new HashMap<>();
        response.put("url", fileDownloadUri);
        response.put("fileName", fileName);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<byte[]> getImage(@PathVariable String fileName) {
        try {
            UploadedImage image = imageStorageService.getFile(fileName);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + image.getFileName() + "\"")
                    .contentType(MediaType.parseMediaType(image.getContentType() != null ? image.getContentType() : "application/octet-stream"))
                    .body(image.getData());
        } catch (Exception e) {
            log.error("Error al obtener imagen: {}", fileName, e);
            return ResponseEntity.notFound().build();
        }
    }
}
