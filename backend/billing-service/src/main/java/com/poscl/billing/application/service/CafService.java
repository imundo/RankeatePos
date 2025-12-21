package com.poscl.billing.application.service;

import com.poscl.billing.api.dto.CafResponse;
import com.poscl.billing.domain.entity.Caf;
import com.poscl.billing.domain.enums.TipoDte;
import com.poscl.billing.domain.repository.CafRepository;
import com.poscl.shared.exception.BusinessConflictException;
import com.poscl.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de CAF (Código de Autorización de Folios)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CafService {

    private final CafRepository cafRepository;

    /**
     * Subir y procesar un nuevo CAF
     */
    @Transactional
    public CafResponse subirCaf(UUID tenantId, String xmlCaf, UUID userId) {
        log.info("Procesando CAF para tenant {}", tenantId);

        // 1. Parsear el XML del CAF
        CafData cafData = parsearCaf(xmlCaf);

        // 2. Validar que no exista ya
        if (cafRepository.existsByTenantIdAndTipoDteAndFolioDesde(
                tenantId, cafData.tipoDte, cafData.folioDesde)) {
            throw new BusinessConflictException("CAF_DUPLICADO",
                    "Ya existe un CAF con el mismo rango de folios para " + cafData.tipoDte.getDescripcion());
        }

        // 3. Crear entidad CAF
        Caf caf = Caf.builder()
                .tenantId(tenantId)
                .tipoDte(cafData.tipoDte)
                .folioDesde(cafData.folioDesde)
                .folioHasta(cafData.folioHasta)
                .folioActual(cafData.folioDesde)
                .fechaAutorizacion(cafData.fechaAutorizacion)
                .fechaVencimiento(cafData.fechaVencimiento)
                .xmlCaf(xmlCaf)
                .rsaPrivateKey(cafData.rsaPrivateKey)
                .rsaPublicKey(cafData.rsaPublicKey)
                .rsaModulus(cafData.rsaModulus)
                .rsaExponent(cafData.rsaExponent)
                .activo(true)
                .agotado(false)
                .createdBy(userId)
                .build();

        Caf saved = cafRepository.save(caf);
        log.info("CAF guardado: tipo={}, folios {}-{}, id={}", 
                saved.getTipoDte(), saved.getFolioDesde(), saved.getFolioHasta(), saved.getId());

        return toResponse(saved);
    }

    /**
     * Listar CAFs activos por tenant
     */
    @Transactional(readOnly = true)
    public List<CafResponse> listarCafs(UUID tenantId) {
        return cafRepository.findByTenantIdAndActivoTrue(tenantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Listar CAFs por tipo de DTE
     */
    @Transactional(readOnly = true)
    public List<CafResponse> listarCafsPorTipo(UUID tenantId, TipoDte tipoDte) {
        return cafRepository.findByTenantIdAndTipoDteAndActivoTrue(tenantId, tipoDte)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtener folios disponibles por tipo
     */
    @Transactional(readOnly = true)
    public Map<TipoDte, Integer> getFoliosDisponibles(UUID tenantId) {
        Map<TipoDte, Integer> folios = new HashMap<>();
        
        for (TipoDte tipo : TipoDte.values()) {
            Integer count = cafRepository.countFoliosDisponibles(tenantId, tipo).orElse(0);
            folios.put(tipo, count);
        }
        
        return folios;
    }

    /**
     * Desactivar un CAF
     */
    @Transactional
    public void desactivarCaf(UUID tenantId, UUID cafId) {
        Caf caf = cafRepository.findById(cafId)
                .filter(c -> c.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("CAF no encontrado"));

        caf.setActivo(false);
        cafRepository.save(caf);
        log.info("CAF desactivado: {}", cafId);
    }

    // --- Métodos privados ---

    private CafData parsearCaf(String xmlCaf) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new ByteArrayInputStream(xmlCaf.getBytes(StandardCharsets.UTF_8)));

            Element autorizacion = (Element) doc.getElementsByTagName("CAF").item(0);
            if (autorizacion == null) {
                throw new BusinessConflictException("CAF_INVALIDO", "El XML no contiene un CAF válido");
            }

            Element da = (Element) autorizacion.getElementsByTagName("DA").item(0);
            
            // Tipo DTE
            int tipoCodigo = Integer.parseInt(getElementText(da, "TD"));
            TipoDte tipoDte = TipoDte.fromCodigo(tipoCodigo);

            // Rango de folios
            Element rng = (Element) da.getElementsByTagName("RNG").item(0);
            int folioDesde = Integer.parseInt(getElementText(rng, "D"));
            int folioHasta = Integer.parseInt(getElementText(rng, "H"));

            // Fecha autorización
            String fechaStr = getElementText(da, "FA");
            LocalDate fechaAutorizacion = LocalDate.parse(fechaStr, DateTimeFormatter.ISO_LOCAL_DATE);

            // RSA Keys
            Element rsak = (Element) autorizacion.getElementsByTagName("RSAK").item(0);
            String rsaModulus = getElementText(rsak, "M");
            String rsaExponent = getElementText(rsak, "E");

            Element rsask = (Element) autorizacion.getElementsByTagName("RSASK").item(0);
            String rsaPrivateKey = rsask != null ? rsask.getTextContent().trim() : null;

            Element rsapk = (Element) autorizacion.getElementsByTagName("RSAPK").item(0);
            String rsaPublicKey = rsapk != null ? rsapk.getTextContent().trim() : null;

            // Fecha vencimiento (si existe)
            LocalDate fechaVencimiento = null;
            String fechaVencStr = getElementTextOptional(da, "FECHAV");
            if (fechaVencStr != null && !fechaVencStr.isEmpty()) {
                fechaVencimiento = LocalDate.parse(fechaVencStr, DateTimeFormatter.ISO_LOCAL_DATE);
            }

            return new CafData(tipoDte, folioDesde, folioHasta, fechaAutorizacion, fechaVencimiento,
                    rsaPrivateKey, rsaPublicKey, rsaModulus, rsaExponent);

        } catch (BusinessConflictException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error parseando CAF: {}", e.getMessage());
            throw new BusinessConflictException("CAF_INVALIDO", "Error al procesar el archivo CAF: " + e.getMessage());
        }
    }

    private String getElementText(Element parent, String tagName) {
        NodeList nodes = parent.getElementsByTagName(tagName);
        if (nodes.getLength() == 0) {
            throw new BusinessConflictException("CAF_INVALIDO", "Falta elemento requerido: " + tagName);
        }
        return nodes.item(0).getTextContent().trim();
    }

    private String getElementTextOptional(Element parent, String tagName) {
        NodeList nodes = parent.getElementsByTagName(tagName);
        if (nodes.getLength() == 0) {
            return null;
        }
        return nodes.item(0).getTextContent().trim();
    }

    private record CafData(
            TipoDte tipoDte,
            int folioDesde,
            int folioHasta,
            LocalDate fechaAutorizacion,
            LocalDate fechaVencimiento,
            String rsaPrivateKey,
            String rsaPublicKey,
            String rsaModulus,
            String rsaExponent
    ) {}

    private CafResponse toResponse(Caf caf) {
        return CafResponse.builder()
                .id(caf.getId())
                .tipoDte(caf.getTipoDte())
                .tipoDteDescripcion(caf.getTipoDte().getDescripcion())
                .folioDesde(caf.getFolioDesde())
                .folioHasta(caf.getFolioHasta())
                .folioActual(caf.getFolioActual())
                .foliosDisponibles(caf.foliosDisponibles())
                .porcentajeUso(caf.porcentajeUso())
                .fechaAutorizacion(caf.getFechaAutorizacion())
                .fechaVencimiento(caf.getFechaVencimiento())
                .vencido(caf.isVencido())
                .activo(caf.getActivo())
                .agotado(caf.getAgotado())
                .build();
    }
}
