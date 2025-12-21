package com.poscl.billing.infrastructure.security;

import com.poscl.billing.domain.entity.CertificadoDigital;
import com.poscl.billing.domain.repository.CertificadoRepository;
import com.poscl.shared.exception.BusinessConflictException;
import com.poscl.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.security.*;
import java.security.cert.X509Certificate;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gestión de certificados digitales para firma electrónica
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CertificateManager {

    private final CertificadoRepository certificadoRepository;
    
    // Cache de keystores cargados
    private final Map<UUID, KeyStoreEntry> keyStoreCache = new ConcurrentHashMap<>();

    /**
     * Obtener certificado X509 para un tenant
     */
    public X509Certificate getCertificate(UUID tenantId) {
        KeyStoreEntry entry = getKeyStoreEntry(tenantId);
        return entry.certificate;
    }

    /**
     * Obtener clave privada para un tenant
     */
    public PrivateKey getPrivateKey(UUID tenantId) {
        KeyStoreEntry entry = getKeyStoreEntry(tenantId);
        return entry.privateKey;
    }

    /**
     * Cargar y cachear keystore
     */
    private KeyStoreEntry getKeyStoreEntry(UUID tenantId) {
        return keyStoreCache.computeIfAbsent(tenantId, this::loadKeyStore);
    }

    private KeyStoreEntry loadKeyStore(UUID tenantId) {
        log.debug("Cargando keystore para tenant {}", tenantId);
        
        CertificadoDigital cert = certificadoRepository.findByTenantIdAndActivoTrue(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No hay certificado digital configurado para este tenant"));

        // Verificar vencimiento
        if (cert.getFechaVencimiento().isBefore(java.time.LocalDate.now())) {
            throw new BusinessConflictException("CERTIFICADO_VENCIDO",
                    "El certificado digital está vencido desde " + cert.getFechaVencimiento());
        }

        try {
            // Desencriptar password (TODO: usar vault o KMS en producción)
            String password = decryptPassword(cert.getPfxPasswordEncrypted());
            
            // Cargar keystore PKCS12
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(new ByteArrayInputStream(cert.getPfxData()), password.toCharArray());

            // Obtener alias (normalmente hay uno solo)
            String alias = keyStore.aliases().nextElement();
            
            X509Certificate certificate = (X509Certificate) keyStore.getCertificate(alias);
            PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias, password.toCharArray());

            log.info("Certificado cargado: subject={}, válido hasta={}",
                    certificate.getSubjectX500Principal().getName(),
                    certificate.getNotAfter());

            return new KeyStoreEntry(certificate, privateKey);

        } catch (Exception e) {
            log.error("Error cargando certificado para tenant {}: {}", tenantId, e.getMessage(), e);
            throw new BusinessConflictException("CERTIFICADO_INVALIDO",
                    "Error al cargar el certificado digital: " + e.getMessage());
        }
    }

    /**
     * Invalidar cache del certificado (cuando se actualiza)
     */
    public void invalidateCache(UUID tenantId) {
        keyStoreCache.remove(tenantId);
        log.debug("Cache de certificado invalidado para tenant {}", tenantId);
    }

    /**
     * Desencriptar password del certificado
     * TODO: Implementar con AES o usar vault en producción
     */
    private String decryptPassword(String encryptedPassword) {
        // Por ahora, asumimos que el password está en Base64
        // En producción, usar AES con clave desde variables de entorno o vault
        try {
            return new String(java.util.Base64.getDecoder().decode(encryptedPassword));
        } catch (Exception e) {
            // Si no está encriptado, retornar tal cual
            return encryptedPassword;
        }
    }

    private record KeyStoreEntry(X509Certificate certificate, PrivateKey privateKey) {}
}
