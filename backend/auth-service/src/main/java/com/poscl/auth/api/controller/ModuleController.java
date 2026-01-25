package com.poscl.auth.api.controller;

import com.poscl.auth.api.dto.ModuleDto;
import com.poscl.auth.application.service.ModuleService;
import com.poscl.auth.domain.entity.Module;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/modules")
@RequiredArgsConstructor
@Tag(name = "Modules", description = "Gestión de Módulos (Acceso General)")
public class ModuleController {

    private final ModuleService moduleService;

    @GetMapping
    @Operation(summary = "Listar módulos", description = "Catálogo de funcionalidades del sistema")
    public ResponseEntity<List<ModuleDto>> listModules() {
        log.info("GET /api/modules - Listing all modules");
        List<ModuleDto> modules = moduleService.findAll().stream()
                .map(this::toModuleDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(modules);
    }

    @GetMapping("/grouped")
    @Operation(summary = "Módulos agrupados", description = "Módulos por categoría")
    public ResponseEntity<Map<String, List<ModuleDto>>> listModulesGrouped() {
        log.info("GET /api/modules/grouped");
        Map<String, List<ModuleDto>> grouped = moduleService.findAllGroupedByCategory()
                .entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().stream().map(this::toModuleDto).collect(Collectors.toList())));
        return ResponseEntity.ok(grouped);
    }

    private ModuleDto toModuleDto(Module module) {
        return ModuleDto.builder()
                .id(module.getId())
                .code(module.getCode())
                .name(module.getName())
                .description(module.getDescription())
                .icon(module.getIcon())
                .category(module.getCategory())
                .sortOrder(module.getSortOrder())
                .active(module.getActive())
                .build();
    }
}
