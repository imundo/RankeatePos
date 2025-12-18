package com.poscl.shared.exception;

import org.springframework.http.HttpStatus;

/**
 * Recurso no encontrado (404)
 */
public class ResourceNotFoundException extends DomainException {

    public ResourceNotFoundException(String resourceType, Object id) {
        super(
                "RESOURCE_NOT_FOUND",
                String.format("%s con ID '%s' no encontrado", resourceType, id),
                HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String message) {
        super("RESOURCE_NOT_FOUND", message, HttpStatus.NOT_FOUND);
    }
}
