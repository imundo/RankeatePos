package com.poscl.shared.exception;

import org.springframework.http.HttpStatus;

/**
 * Acceso denegado (403)
 */
public class AccessDeniedException extends DomainException {

    public AccessDeniedException(String message) {
        super("ACCESS_DENIED", message, HttpStatus.FORBIDDEN);
    }

    public AccessDeniedException() {
        super("ACCESS_DENIED", "No tiene permisos para realizar esta acción", HttpStatus.FORBIDDEN);
    }
}
