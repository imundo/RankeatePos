package com.poscl.shared.exception;

import org.springframework.http.HttpStatus;

/**
 * Conflicto de negocio (409)
 */
public class BusinessConflictException extends DomainException {

    public BusinessConflictException(String code, String message) {
        super(code, message, HttpStatus.CONFLICT);
    }
}
