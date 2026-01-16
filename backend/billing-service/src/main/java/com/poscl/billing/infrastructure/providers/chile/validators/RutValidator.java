package com.poscl.billing.infrastructure.providers.chile.validators;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Utilidad para validar RUT chileno
 */
@Slf4j
@Component
public class RutValidator {

    /**
     * Valida formato y dígito verificador de RUT chileno
     * 
     * @param rut RUT en formato "12345678-9" o "12.345.678-9"
     * @return true si es válido
     */
    public boolean isValid(String rut) {
        if (rut == null || rut.trim().isEmpty()) {
            return false;
        }

        try {
            // Limpiar formato (remover puntos y guiones)
            String cleanRut = rut.replace(".", "").replace("-", "").trim();

            if (cleanRut.length() < 2) {
                return false;
            }

            // Separar número y dígito verificador
            String rutNumber = cleanRut.substring(0, cleanRut.length() - 1);
            char dv = cleanRut.charAt(cleanRut.length() - 1);

            // Validar que el número sea numérico
            int number = Integer.parseInt(rutNumber);

            // Calcular dígito verificador esperado
            char expectedDv = calculateDv(number);

            return Character.toUpperCase(dv) == expectedDv;

        } catch (NumberFormatException e) {
            log.debug("RUT inválido (formato numérico): {}", rut);
            return false;
        }
    }

    /**
     * Calcula el dígito verificador de un RUT
     * 
     * @param rutNumber Número del RUT sin DV
     * @return Dígito verificador ('0'-'9' o 'K')
     */
    public char calculateDv(int rutNumber) {
        int sum = 0;
        int multiplier = 2;

        while (rutNumber > 0) {
            sum += (rutNumber % 10) * multiplier;
            rutNumber /= 10;
            multiplier = multiplier == 7 ? 2 : multiplier + 1;
        }

        int remainder = 11 - (sum % 11);

        if (remainder == 11) {
            return '0';
        } else if (remainder == 10) {
            return 'K';
        } else {
            return (char) ('0' + remainder);
        }
    }

    /**
     * Formatea un RUT a formato estándar: "12.345.678-9"
     * 
     * @param rut RUT sin formato
     * @return RUT formateado
     */
    public String format(String rut) {
        if (rut == null || rut.trim().isEmpty()) {
            return rut;
        }

        // Limpiar
        String clean = rut.replace(".", "").replace("-", "").trim().toUpperCase();

        if (clean.length() < 2) {
            return rut;
        }

        String number = clean.substring(0, clean.length() - 1);
        char dv = clean.charAt(clean.length() - 1);

        // Agregar puntos de miles
        StringBuilder formatted = new StringBuilder();
        int count = 0;

        for (int i = number.length() - 1; i >= 0; i--) {
            if (count == 3) {
                formatted.insert(0, ".");
                count = 0;
            }
            formatted.insert(0, number.charAt(i));
            count++;
        }

        formatted.append("-").append(dv);
        return formatted.toString();
    }

    /**
     * Limpia el formato de un RUT dejando solo números y DV
     * 
     * @param rut RUT con formato
     * @return RUT limpio "12345678-9"
     */
    public String clean(String rut) {
        if (rut == null) {
            return null;
        }

        String cleaned = rut.replace(".", "").replace(" ", "").trim().toUpperCase();

        // Asegurar que tiene guión
        if (!cleaned.contains("-") && cleaned.length() >= 2) {
            cleaned = cleaned.substring(0, cleaned.length() - 1) + "-" + cleaned.charAt(cleaned.length() - 1);
        }

        return cleaned;
    }
}
