package com.poscl.billing.infrastructure.providers.chile.xml;

import com.poscl.billing.domain.entity.Caf;
import com.poscl.billing.domain.entity.Dte;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.StringWriter;
import java.security.MessageDigest;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

/**
 * Generador de Timbre Electrónico (TED) para DTEs
 * El TED es el código de barras PDF417 que va en el documento
 */
@Slf4j
@Component
public class TedGenerator {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Genera el TED (Timbre Electrónico) para un DTE
     * 
     * @param dte       DTE
     * @param caf       CAF con clave privada
     * @param emisorRut RUT del emisor
     * @return XML del TED como String
     */
    public String generarTed(Dte dte, Caf caf, String emisorRut) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.newDocument();

        // Root: TED
        Element ted = doc.createElement("TED");
        ted.setAttribute("version", "1.0");
        doc.appendChild(ted);

        // DD - Datos del Documento
        Element dd = doc.createElement("DD");

        // RE - RUT Emisor
        Element re = doc.createElement("RE");
        re.setTextContent(emisorRut);
        dd.appendChild(re);

        // TD - Tipo Documento
        Element td = doc.createElement("TD");
        td.setTextContent(String.valueOf(dte.getTipoDte().getCodigo()));
        dd.appendChild(td);

        // F - Folio
        Element f = doc.createElement("F");
        f.setTextContent(String.valueOf(dte.getFolio()));
        dd.appendChild(f);

        // FE - Fecha Emisión
        Element fe = doc.createElement("FE");
        fe.setTextContent(dte.getFechaEmision().format(DATE_FORMAT));
        dd.appendChild(fe);

        // RR - RUT Receptor (si existe)
        if (dte.getReceptorRut() != null && !dte.getReceptorRut().isEmpty()) {
            Element rr = doc.createElement("RR");
            rr.setTextContent(dte.getReceptorRut());
            dd.appendChild(rr);
        }

        // RSR - Razón Social Receptor (si existe)
        if (dte.getReceptorRazonSocial() != null && !dte.getReceptorRazonSocial().isEmpty()) {
            Element rsr = doc.createElement("RSR");
            rsr.setTextContent(
                    dte.getReceptorRazonSocial().substring(0, Math.min(40, dte.getReceptorRazonSocial().length())));
            dd.appendChild(rsr);
        }

        // MNT - Monto Total
        Element mnt = doc.createElement("MNT");
        mnt.setTextContent(dte.getTotal().setScale(0).toString());
        dd.appendChild(mnt);

        // IT1 - Item 1 (primer item del detalle, si existe)
        if (dte.getDetalles() != null && !dte.getDetalles().isEmpty()) {
            Element it1 = doc.createElement("IT1");
            String nombreItem = dte.getDetalles().get(0).getNombre();
            it1.setTextContent(nombreItem.substring(0, Math.min(40, nombreItem.length())));
            dd.appendChild(it1);
        }

        // CAF - Código de Autorización de Folios (simplificado)
        Element cafElement = doc.createElement("CAF");
        cafElement.setAttribute("version", "1.0");

        Element daElement = doc.createElement("DA");

        Element reCAF = doc.createElement("RE");
        reCAF.setTextContent(emisorRut);
        daElement.appendChild(reCAF);

        Element rs = doc.createElement("RS");
        rs.setTextContent(dte.getEmisorRazonSocial() != null ? dte.getEmisorRazonSocial() : "Empresa");
        daElement.appendChild(rs);

        Element tdCAF = doc.createElement("TD");
        tdCAF.setTextContent(String.valueOf(dte.getTipoDte().getCodigo()));
        daElement.appendChild(tdCAF);

        Element rng = doc.createElement("RNG");
        Element d = doc.createElement("D");
        d.setTextContent(String.valueOf(caf.getFolioDesde()));
        rng.appendChild(d);
        Element h = doc.createElement("H");
        h.setTextContent(String.valueOf(caf.getFolioHasta()));
        rng.appendChild(h);
        daElement.appendChild(rng);

        Element fa = doc.createElement("FA");
        fa.setTextContent(caf.getFechaAutorizacion().format(DATE_FORMAT));
        daElement.appendChild(fa);

        // RSAPK - Clave pública del CAF (simplificado para demo)
        Element rsapk = doc.createElement("RSAPK");
        Element m = doc.createElement("M");
        m.setTextContent(caf.getRsaPublicKey() != null ? caf.getRsaPublicKey() : "dummy");
        rsapk.appendChild(m);
        Element e = doc.createElement("E");
        e.setTextContent("Aw=="); // Exponente estándar
        rsapk.appendChild(e);
        daElement.appendChild(rsapk);

        Element idk = doc.createElement("IDK");
        idk.setTextContent("100");
        daElement.appendChild(idk);

        cafElement.appendChild(daElement);

        // FRMA del CAF
        Element frmaCAF = doc.createElement("FRMA");
        frmaCAF.setAttribute("algoritmo", "SHA1withRSA");
        frmaCAF.setTextContent(caf.getSignature() != null ? caf.getSignature() : "dummy");
        cafElement.appendChild(frmaCAF);

        dd.appendChild(cafElement);

        // TSTED - Timestamp
        Element tsted = doc.createElement("TSTED");
        tsted.setTextContent(java.time.Instant.now().toString());
        dd.appendChild(tsted);

        ted.appendChild(dd);

        // FRMT - Firma del TED (hash SHA-1)
        Element frmt = doc.createElement("FRMT");
        frmt.setAttribute("algoritmo", "SHA1withRSA");

        // Calcular digest SHA-1 del DD
        String ddString = elementToString(dd);
        MessageDigest digest = MessageDigest.getInstance("SHA-1");
        byte[] hash = digest.digest(ddString.getBytes("ISO-8859-1"));
        String hashBase64 = Base64.getEncoder().encodeToString(hash);

        // En producción, esto se firma con la clave privada del CAF
        // Por ahora usamos el hash como placeholder
        frmt.setTextContent(hashBase64);
        ted.appendChild(frmt);

        return elementToString(ted);
    }

    private String elementToString(Element element) throws Exception {
        TransformerFactory tf = TransformerFactory.newInstance();
        Transformer transformer = tf.newTransformer();
        transformer.setOutputProperty("omit-xml-declaration", "yes");

        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(element), new StreamResult(writer));
        return writer.toString();
    }
}
