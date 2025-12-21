package com.poscl.billing.infrastructure.sii;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de URLs y endpoints del SII
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "sii")
public class SiiConfig {

    private String environment = "certificacion";
    
    // Modo mock: true = respuestas simuladas, false = llamadas reales al SII
    // Los datos reales de empresa (CAF, certificado) deben configurarse primero
    private boolean mockMode = true;
    
    // URLs ambiente certificación
    private String certBaseUrl = "https://maullin.sii.cl";
    private String certWsdlUrl = "https://maullin.sii.cl/DTEWS/CrSeed.jws?WSDL";
    
    // URLs ambiente producción
    private String prodBaseUrl = "https://palena.sii.cl";
    private String prodWsdlUrl = "https://palena.sii.cl/DTEWS/CrSeed.jws?WSDL";

    // Endpoints comunes
    private static final String SEED_ENDPOINT = "/DTEWS/CrSeed.jws";
    private static final String TOKEN_ENDPOINT = "/DTEWS/GetTokenFromSeed.jws";
    private static final String UPLOAD_ENDPOINT = "/cgi_dte/UPL/DTEUpload";
    private static final String STATUS_ENDPOINT = "/DTEWS/QueryEstUp.jws";
    private static final String DTE_STATUS_ENDPOINT = "/DTEWS/QueryEstDte.jws";
    private static final String ENVIO_BOLETA_ENDPOINT = "/cgi_dte/UPL/DTEBoletaUpload";

    public boolean isProduccion() {
        return "produccion".equalsIgnoreCase(environment);
    }

    public String getBaseUrl() {
        return isProduccion() ? prodBaseUrl : certBaseUrl;
    }

    public String getSeedUrl() {
        return getBaseUrl() + SEED_ENDPOINT;
    }

    public String getTokenUrl() {
        return getBaseUrl() + TOKEN_ENDPOINT;
    }

    public String getUploadUrl() {
        return getBaseUrl() + UPLOAD_ENDPOINT;
    }

    public String getBoletaUploadUrl() {
        return getBaseUrl() + ENVIO_BOLETA_ENDPOINT;
    }

    public String getStatusUrl() {
        return getBaseUrl() + STATUS_ENDPOINT;
    }

    public String getDteStatusUrl() {
        return getBaseUrl() + DTE_STATUS_ENDPOINT;
    }
}
