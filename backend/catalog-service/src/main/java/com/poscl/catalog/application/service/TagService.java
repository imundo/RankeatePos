package com.poscl.catalog.application.service;

import com.poscl.catalog.api.dto.TagDto;
import com.poscl.catalog.domain.entity.Tag;
import com.poscl.catalog.domain.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TagService {

    private final TagRepository tagRepository;

    public List<TagDto> getAllTags(UUID tenantId) {
        log.info("Obteniendo todos los tags para tenant: {}", tenantId);
        return tagRepository.findByTenantIdOrderByNombreAsc(tenantId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<TagDto> getActiveTags(UUID tenantId) {
        log.info("Obteniendo tags activos para tenant: {}", tenantId);
        return tagRepository.findByTenantIdAndActivoTrueOrderByNombreAsc(tenantId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public TagDto getTagById(UUID tenantId, UUID tagId) {
        log.info("Obteniendo tag {} para tenant {}", tagId, tenantId);
        return tagRepository.findByTenantIdAndId(tenantId, tagId)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Tag no encontrado"));
    }

    public TagDto createTag(UUID tenantId, TagDto dto) {
        log.info("Creando tag '{}' para tenant {}", dto.getNombre(), tenantId);

        // Validar nombre único
        if (tagRepository.existsByTenantIdAndNombre(tenantId, dto.getNombre())) {
            throw new RuntimeException("Ya existe un tag con ese nombre");
        }

        Tag tag = Tag.builder()
                .tenantId(tenantId)
                .nombre(dto.getNombre())
                .color(dto.getColor() != null ? dto.getColor() : "#6366F1")
                .icono(dto.getIcono() != null ? dto.getIcono() : "🏷️")
                .descripcion(dto.getDescripcion())
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                .build();

        tag = tagRepository.save(tag);
        log.info("Tag creado con ID: {}", tag.getId());

        return toDto(tag);
    }

    public TagDto updateTag(UUID tenantId, UUID tagId, TagDto dto) {
        log.info("Actualizando tag {} para tenant {}", tagId, tenantId);

        Tag tag = tagRepository.findByTenantIdAndId(tenantId, tagId)
                .orElseThrow(() -> new RuntimeException("Tag no encontrado"));

        // Validar nombre único (excluyendo el actual)
        if (tagRepository.existsByTenantIdAndNombreAndIdNot(tenantId, dto.getNombre(), tagId)) {
            throw new RuntimeException("Ya existe otro tag con ese nombre");
        }

        tag.setNombre(dto.getNombre());
        if (dto.getColor() != null)
            tag.setColor(dto.getColor());
        if (dto.getIcono() != null)
            tag.setIcono(dto.getIcono());
        if (dto.getDescripcion() != null)
            tag.setDescripcion(dto.getDescripcion());
        if (dto.getActivo() != null)
            tag.setActivo(dto.getActivo());

        tag = tagRepository.save(tag);
        log.info("Tag actualizado: {}", tag.getId());

        return toDto(tag);
    }

    public void deleteTag(UUID tenantId, UUID tagId) {
        log.info("Eliminando tag {} para tenant {}", tagId, tenantId);

        Tag tag = tagRepository.findByTenantIdAndId(tenantId, tagId)
                .orElseThrow(() -> new RuntimeException("Tag no encontrado"));

        // Soft delete - solo desactivar
        tag.setActivo(false);
        tagRepository.save(tag);
        log.info("Tag desactivado: {}", tagId);
    }

    public void hardDeleteTag(UUID tenantId, UUID tagId) {
        log.info("Eliminando permanentemente tag {} para tenant {}", tagId, tenantId);

        Tag tag = tagRepository.findByTenantIdAndId(tenantId, tagId)
                .orElseThrow(() -> new RuntimeException("Tag no encontrado"));

        tagRepository.delete(tag);
        log.info("Tag eliminado permanentemente: {}", tagId);
    }

    private TagDto toDto(Tag tag) {
        return TagDto.builder()
                .id(tag.getId())
                .nombre(tag.getNombre())
                .color(tag.getColor())
                .icono(tag.getIcono())
                .descripcion(tag.getDescripcion())
                .activo(tag.getActivo())
                .productCount(tag.getProducts() != null ? tag.getProducts().size() : 0)
                .build();
    }
}
