import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    const token = authService.getToken();
    const tenantId = authService.getTenantId();
    const userId = authService.getUserId();

    if (token) {
        let headers = req.headers.set('Authorization', `Bearer ${token}`);

        if (tenantId) {
            headers = headers.set('X-Tenant-Id', tenantId);
        }

        if (userId) {
            headers = headers.set('X-User-Id', userId);
        }

        req = req.clone({ headers });
    }

    return next(req);
};
