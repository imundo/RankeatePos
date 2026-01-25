import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.authService.getToken();
        const tenantId = this.authService.getTenantId();

        let headers = request.headers;

        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        if (tenantId && !headers.has('X-Tenant-Id') && !headers.has('X-Tenant-ID')) {
            headers = headers.set('X-Tenant-Id', tenantId);
        }

        const authRequest = request.clone({ headers });
        return next.handle(authRequest);
    }
}
