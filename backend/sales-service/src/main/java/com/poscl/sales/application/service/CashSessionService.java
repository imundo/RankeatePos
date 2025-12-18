package com.poscl.sales.application.service;

import com.poscl.sales.api.dto.*;
import com.poscl.sales.domain.entity.*;
import com.poscl.sales.domain.repository.*;
import com.poscl.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CashSessionService {

    private final CashSessionRepository sessionRepository;
    private final CashRegisterRepository registerRepository;

    /**
     * Abre una nueva sesión de caja
     */
    @Transactional
    public CashSessionDto openSession(UUID tenantId, UUID userId, OpenCashSessionRequest request) {
        // Verificar que no hay sesión abierta para este usuario
        sessionRepository.findOpenByUserId(userId).ifPresent(s -> {
            throw new BusinessException("SESSION_ALREADY_OPEN",
                    "Ya tiene una sesión de caja abierta");
        });

        // Obtener o crear caja
        CashRegister register = registerRepository.findById(request.getRegisterId())
                .orElseThrow(() -> new BusinessException("REGISTER_NOT_FOUND", "Caja no encontrada"));

        // Verificar que la caja no está en uso
        sessionRepository.findOpenByRegisterId(register.getId()).ifPresent(s -> {
            throw new BusinessException("REGISTER_IN_USE", "Esta caja ya está en uso");
        });

        CashSession session = CashSession.builder()
                .tenantId(tenantId)
                .register(register)
                .userId(userId)
                .montoInicial(request.getMontoInicial())
                .estado(CashSession.Estado.ABIERTA)
                .aperturaAt(Instant.now())
                .build();

        session = sessionRepository.save(session);
        log.info("Sesión de caja abierta: id={}, user={}, register={}",
                session.getId(), userId, register.getId());

        return toDto(session);
    }

    /**
     * Cierra una sesión de caja
     */
    @Transactional
    public CashSessionDto closeSession(UUID tenantId, UUID userId, UUID sessionId, CloseCashSessionRequest request) {
        CashSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException("SESSION_NOT_FOUND", "Sesión no encontrada"));

        // Verificar pertenece al tenant
        if (!session.getTenantId().equals(tenantId)) {
            throw new BusinessException("UNAUTHORIZED", "No autorizado");
        }

        // Verificar está abierta
        if (!session.isOpen()) {
            throw new BusinessException("SESSION_CLOSED", "La sesión ya está cerrada");
        }

        session.close(request.getMontoFinal(), request.getNota());
        session = sessionRepository.save(session);

        log.info("Sesión de caja cerrada: id={}, montoFinal={}, diferencia={}",
                session.getId(), request.getMontoFinal(), session.getDiferencia());

        return toDto(session);
    }

    /**
     * Obtiene la sesión actual del usuario
     */
    public CashSessionDto getCurrentSession(UUID userId) {
        CashSession session = sessionRepository.findOpenByUserId(userId)
                .orElseThrow(() -> new BusinessException("NO_OPEN_SESSION",
                        "No tiene sesión de caja abierta"));
        return toDto(session);
    }

    /**
     * Lista sesiones por tenant
     */
    public List<CashSessionDto> findByTenant(UUID tenantId) {
        return sessionRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una sesión por ID
     */
    public CashSessionDto findById(UUID tenantId, UUID sessionId) {
        CashSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException("SESSION_NOT_FOUND", "Sesión no encontrada"));

        if (!session.getTenantId().equals(tenantId)) {
            throw new BusinessException("UNAUTHORIZED", "No autorizado");
        }

        return toDto(session);
    }

    private CashSessionDto toDto(CashSession s) {
        return CashSessionDto.builder()
                .id(s.getId())
                .registerId(s.getRegisterId())
                .userId(s.getUserId())
                .montoInicial(s.getMontoInicial())
                .montoFinal(s.getMontoFinal())
                .montoTeorico(s.getMontoTeorico())
                .diferencia(s.getDiferencia())
                .estado(s.getEstado().name())
                .aperturaAt(s.getAperturaAt())
                .cierreAt(s.getCierreAt())
                .cierreNota(s.getCierreNota())
                .build();
    }
}
