package com.poscl.catalog.api.controller;

import com.poscl.catalog.api.dto.TagDto;
import com.poscl.catalog.application.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TagController {

    private final TagService tagService;

    /**
     * Obtiene todos los tags del tenant
     */
    @GetMapping
    public ResponseEntity<List<TagDto>> getAllTags(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(required = false, defaultValue = "true") Boolean activeOnly) {

        log.info("GET /api/tags - TenantId: {}, activeOnly: {}", tenantId, activeOnly);

        List<TagDto> tags = activeOnly
                ? tagService.getActiveTags(tenantId)
                : tagService.getAllTags(tenantId);

        return ResponseEntity.ok(tags);
    }

    /**
     * Obtiene un tag por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TagDto> getTagById(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id) {

        log.info("GET /api/tags/{} - TenantId: {}", id, tenantId);
        return ResponseEntity.ok(tagService.getTagById(tenantId, id));
    }

    /**
     * Crea un nuevo tag
     */
    @PostMapping
    public ResponseEntity<TagDto> createTag(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @Valid @RequestBody TagDto dto) {

        log.info("POST /api/tags - TenantId: {}, nombre: {}", tenantId, dto.getNombre());
        TagDto created = tagService.createTag(tenantId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Actualiza un tag existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<TagDto> updateTag(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @Valid @RequestBody TagDto dto) {

        log.info("PUT /api/tags/{} - TenantId: {}", id, tenantId);
        return ResponseEntity.ok(tagService.updateTag(tenantId, id, dto));
    }

    /**
     * Desactiva un tag (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "false") Boolean permanent) {

        log.info("DELETE /api/tags/{} - TenantId: {}, permanent: {}", id, tenantId, permanent);

        if (permanent) {
            tagService.hardDeleteTag(tenantId, id);
        } else {
            tagService.deleteTag(tenantId, id);
        }

        return ResponseEntity.noContent().build();
    }
}
