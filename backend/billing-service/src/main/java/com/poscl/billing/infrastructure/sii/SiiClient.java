package com.poscl.billing.infrastructure.sii;

import com.poscl.billing.domain.entity.Dte;
import com.poscl.billing.domain.enums.EstadoDte;
import com.poscl.billing.domain.enums.TipoDte;
import com.poscl.billing.infrastructure.providers.BillingProvider.SendResult;
import com.poscl.billing.infrastructure.providers.BillingProvider.StatusResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Cliente para comunicación con web services del SII
 * Maneja envío de DTEs y consulta de estado
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SiiClient {

    private final SiiConfig siiConfig;
    private final SiiAuthService authService;
    private final WebClient.Builder webClientBuilder;

    /**
     * Enviar DTE al SII
     * @param signedXml XML firmado del DTE
     * @param dte Entidad DTE para obtener metadatos
     * @param tenantId ID del tenant
     * @return Resultado del envío con trackId
     */
    public SendResult enviarDte(String signedXml, Dte dte, UUID tenantId) {
        log.info("Enviando DTE al SII: tipo={}, folio={}", dte.getTipoDte(), dte.getFolio());
        
        // Modo mock: retorna respuesta simulada (para desarrollo/pruebas)
        if (siiConfig.isMockMode()) {
            log.info("MODO MOCK: Simulando envío exitoso al SII");
            String trackId = "MOCK-" + System.currentTimeMillis() + "-" + dte.getFolio();
            return SendResult.ok(trackId);
        }
        
        try {
            String token = authService.getToken(tenantId);
            
            // Construir EnvioDTE (sobre XML)
            String envioDteXml = buildEnvioDte(signedXml, dte);
            
            // Determinar endpoint según tipo de documento
            String uploadUrl = isBoleta(dte.getTipoDte()) 
                    ? siiConfig.getBoletaUploadUrl() 
                    : siiConfig.getUploadUrl();
            
            // Preparar multipart
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("rutSender", dte.getEmisorRut().replace("-", "").replace(".", ""));
            builder.part("dvSender", getDigitoVerificador(dte.getEmisorRut()));
            builder.part("rutCompany", dte.getEmisorRut().replace("-", "").replace(".", ""));
            builder.part("dvCompany", getDigitoVerificador(dte.getEmisorRut()));
            builder.part("archivo", new ByteArrayResource(envioDteXml.getBytes(StandardCharsets.ISO_8859_1)) {
                @Override
                public String getFilename() {
                    return "envio_dte.xml";
                }
            });

            WebClient client = webClientBuilder.build();
            
            String response = client.post()
                    .uri(uploadUrl)
                    .header("Cookie", "TOKEN=" + token)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(60));

            return parseUploadResponse(response);
            
        } catch (Exception e) {
            log.error("Error enviando DTE al SII: {}", e.getMessage(), e);
            return SendResult.error("ERROR_ENVIO", e.getMessage());
        }
    }

    /**
     * Consultar estado de un envío
     */
    public StatusResult consultarEstadoEnvio(String trackId, String rutEmisor, UUID tenantId) {
        log.debug("Consultando estado de envío: trackId={}", trackId);
        
        try {
            String token = authService.getToken(tenantId);
            
            String soapRequest = buildEstadoEnvioRequest(trackId, rutEmisor);
            
            WebClient client = webClientBuilder.build();
            
            String response = client.post()
                    .uri(siiConfig.getStatusUrl())
                    .header("Cookie", "TOKEN=" + token)
                    .header("Content-Type", "text/xml; charset=UTF-8")
                    .bodyValue(soapRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(30));

            return parseEstadoEnvioResponse(response);
            
        } catch (Exception e) {
            log.error("Error consultando estado: {}", e.getMessage());
            return StatusResult.pending();
        }
    }

    /**
     * Consultar estado de un DTE específico
     */
    public StatusResult consultarEstadoDte(Dte dte, UUID tenantId) {
        log.debug("Consultando estado DTE: tipo={}, folio={}", dte.getTipoDte(), dte.getFolio());
        
        try {
            String token = authService.getToken(tenantId);
            
            String soapRequest = buildEstadoDteRequest(dte);
            
            WebClient client = webClientBuilder.build();
            
            String response = client.post()
                    .uri(siiConfig.getDteStatusUrl())
                    .header("Cookie", "TOKEN=" + token)
                    .header("Content-Type", "text/xml; charset=UTF-8")
                    .bodyValue(soapRequest)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(30));

            return parseEstadoDteResponse(response);
            
        } catch (Exception e) {
            log.error("Error consultando estado DTE: {}", e.getMessage());
            return StatusResult.pending();
        }
    }

    // === Métodos privados ===

    private String buildEnvioDte(String dteXml, Dte dte) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>\n");
        sb.append("<EnvioDTE version=\"1.0\">\n");
        sb.append("  <SetDTE ID=\"SetDoc\">\n");
        sb.append("    <Caratula version=\"1.0\">\n");
        sb.append("      <RutEmisor>").append(dte.getEmisorRut()).append("</RutEmisor>\n");
        sb.append("      <RutEnvia>").append(dte.getEmisorRut()).append("</RutEnvia>\n");
        sb.append("      <RutReceptor>").append(dte.getReceptorRut() != null ? dte.getReceptorRut() : "60803000-K").append("</RutReceptor>\n");
        sb.append("      <FchResol>").append(dte.getFechaEmision()).append("</FchResol>\n");
        sb.append("      <NroResol>0</NroResol>\n");
        sb.append("      <TmstFirmaEnv>").append(java.time.LocalDateTime.now()).append("</TmstFirmaEnv>\n");
        sb.append("      <SubTotDTE>\n");
        sb.append("        <TpoDTE>").append(dte.getTipoDte().getCodigo()).append("</TpoDTE>\n");
        sb.append("        <NroDTE>1</NroDTE>\n");
        sb.append("      </SubTotDTE>\n");
        sb.append("    </Caratula>\n");
        sb.append(dteXml);
        sb.append("  </SetDTE>\n");
        sb.append("</EnvioDTE>");
        return sb.toString();
    }

    private String buildEstadoEnvioRequest(String trackId, String rutEmisor) {
        return """
            <?xml version="1.0" encoding="UTF-8"?>
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
                <soapenv:Body>
                    <getEstUp xmlns="http://ws.sii.cl/DTE/QueryEstUp">
                        <rutEmpresa>%s</rutEmpresa>
                        <dvEmpresa>%s</dvEmpresa>
                        <trackId>%s</trackId>
                    </getEstUp>
                </soapenv:Body>
            </soapenv:Envelope>
            """.formatted(
                rutEmisor.replace("-", "").replace(".", "").substring(0, rutEmisor.length() - 2),
                getDigitoVerificador(rutEmisor),
                trackId
            );
    }

    private String buildEstadoDteRequest(Dte dte) {
        return """
            <?xml version="1.0" encoding="UTF-8"?>
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
                <soapenv:Body>
                    <getEstDte xmlns="http://ws.sii.cl/DTE/QueryEstDte">
                        <rutConsultante>%s</rutConsultante>
                        <dvConsultante>%s</dvConsultante>
                        <rutCompania>%s</rutCompania>
                        <dvCompania>%s</dvCompania>
                        <rutReceptor>%s</rutReceptor>
                        <dvReceptor>%s</dvReceptor>
                        <tipoDte>%d</tipoDte>
                        <folioDte>%d</folioDte>
                        <fechaEmisionDte>%s</fechaEmisionDte>
                        <montoDte>%d</montoDte>
                    </getEstDte>
                </soapenv:Body>
            </soapenv:Envelope>
            """.formatted(
                getRutBody(dte.getEmisorRut()), getDigitoVerificador(dte.getEmisorRut()),
                getRutBody(dte.getEmisorRut()), getDigitoVerificador(dte.getEmisorRut()),
                getRutBody(dte.getReceptorRut() != null ? dte.getReceptorRut() : "66666666-6"), 
                getDigitoVerificador(dte.getReceptorRut() != null ? dte.getReceptorRut() : "66666666-6"),
                dte.getTipoDte().getCodigo(),
                dte.getFolio(),
                dte.getFechaEmision(),
                dte.getMontoTotal().longValue()
            );
    }

    private SendResult parseUploadResponse(String response) {
        if (response == null) {
            return SendResult.error("SIN_RESPUESTA", "No se recibió respuesta del SII");
        }
        
        // Buscar TRACKID
        Pattern trackPattern = Pattern.compile("<TRACKID>(\\d+)</TRACKID>");
        Matcher trackMatcher = trackPattern.matcher(response);
        
        if (trackMatcher.find()) {
            String trackId = trackMatcher.group(1);
            log.info("DTE enviado exitosamente - TrackId: {}", trackId);
            return SendResult.ok(trackId);
        }
        
        // Buscar error
        Pattern errorPattern = Pattern.compile("<GLOSA>(.+?)</GLOSA>");
        Matcher errorMatcher = errorPattern.matcher(response);
        
        if (errorMatcher.find()) {
            String error = errorMatcher.group(1);
            log.warn("Error del SII: {}", error);
            return SendResult.error("ERROR_SII", error);
        }
        
        return SendResult.error("ERROR_DESCONOCIDO", "Respuesta no reconocida del SII");
    }

    private StatusResult parseEstadoEnvioResponse(String response) {
        if (response == null) return StatusResult.pending();
        
        // Estados: EPR (En Proceso), RCT (Rechazado por Error), RCH (Rechazado), etc.
        Pattern estadoPattern = Pattern.compile("<ESTADO>(.+?)</ESTADO>");
        Pattern glosaPattern = Pattern.compile("<GLOSA>(.+?)</GLOSA>");
        
        Matcher estadoMatcher = estadoPattern.matcher(response);
        Matcher glosaMatcher = glosaPattern.matcher(response);
        
        String estado = estadoMatcher.find() ? estadoMatcher.group(1) : "PENDIENTE";
        String glosa = glosaMatcher.find() ? glosaMatcher.group(1) : "";
        
        return switch (estado) {
            case "EPR" -> StatusResult.pending();
            case "DOK" -> StatusResult.accepted("Documento aceptado");
            case "DNK" -> StatusResult.rejected("Documento rechazado: " + glosa);
            case "RCT", "RCH", "RFR" -> StatusResult.rejected(glosa);
            default -> new StatusResult(estado, false, glosa, null);
        };
    }

    private StatusResult parseEstadoDteResponse(String response) {
        if (response == null) return StatusResult.pending();
        
        Pattern estadoPattern = Pattern.compile("<ESTADO>(.+?)</ESTADO>");
        Pattern glosaPattern = Pattern.compile("<GLOSA_ESTADO>(.+?)</GLOSA_ESTADO>");
        
        Matcher estadoMatcher = estadoPattern.matcher(response);
        Matcher glosaMatcher = glosaPattern.matcher(response);
        
        String estado = estadoMatcher.find() ? estadoMatcher.group(1) : "PENDIENTE";
        String glosa = glosaMatcher.find() ? glosaMatcher.group(1) : "";
        
        boolean accepted = "DOK".equals(estado) || estado.startsWith("0");
        return new StatusResult(estado, accepted, glosa, null);
    }

    private boolean isBoleta(TipoDte tipo) {
        return tipo == TipoDte.BOLETA_ELECTRONICA || tipo == TipoDte.BOLETA_EXENTA;
    }

    private String getRutBody(String rut) {
        if (rut == null) return "";
        String clean = rut.replace(".", "").replace("-", "");
        return clean.substring(0, clean.length() - 1);
    }

    private String getDigitoVerificador(String rut) {
        if (rut == null) return "";
        String clean = rut.replace(".", "").replace("-", "");
        return clean.substring(clean.length() - 1);
    }
}
