import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
    private activeRequests = 0;

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.activeRequests++;

        // Add loading indicator
        if (this.activeRequests === 1) {
            document.body.classList.add('loading');
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage = 'Ha ocurrido un error';

                if (error.error instanceof ErrorEvent) {
                    // Client-side error
                    errorMessage = `Error: ${error.error.message}`;
                } else {
                    // Server-side error
                    switch (error.status) {
                        case 400:
                            errorMessage = error.error?.message || 'Datos inválidos';
                            break;
                        case 401:
                            errorMessage = 'Sesión expirada. Por favor inicie sesión nuevamente.';
                            // Could redirect to login here
                            break;
                        case 403:
                            errorMessage = 'No tiene permisos para realizar esta acción';
                            break;
                        case 404:
                            errorMessage = 'Recurso no encontrado';
                            break;
                        case 500:
                            errorMessage = 'Error interno del servidor';
                            break;
                        default:
                            errorMessage = `Error ${error.status}: ${error.message}`;
                    }
                }

                // Show toast notification
                this.showErrorToast(errorMessage);

                return throwError(() => new Error(errorMessage));
            }),
            finalize(() => {
                this.activeRequests--;
                if (this.activeRequests === 0) {
                    document.body.classList.remove('loading');
                }
            })
        );
    }

    private showErrorToast(message: string): void {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
      <span class="toast-icon">⚠️</span>
      <span class="toast-message">${message}</span>
    `;
        document.body.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}
