import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'Error desconocido';

            if (error.error instanceof ErrorEvent) {
                // Error del cliente
                errorMessage = error.error.message;
            } else {
                // Error del servidor
                switch (error.status) {
                    case 401:
                        errorMessage = 'Sesión expirada. Por favor inicie sesión nuevamente.';
                        router.navigate(['/auth/login']);
                        break;
                    case 403:
                        errorMessage = 'No tiene permisos para realizar esta acción.';
                        break;
                    case 404:
                        errorMessage = 'Recurso no encontrado.';
                        break;
                    case 409:
                        errorMessage = error.error?.message || 'Conflicto con los datos.';
                        break;
                    case 500:
                        errorMessage = 'Error interno del servidor.';
                        break;
                    default:
                        errorMessage = error.error?.message || `Error: ${error.status}`;
                }
            }

            console.error('HTTP Error:', error);

            return throwError(() => ({ ...error, displayMessage: errorMessage }));
        })
    );
};
