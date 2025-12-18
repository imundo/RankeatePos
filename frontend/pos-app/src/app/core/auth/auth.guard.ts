import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirigir a login manteniendo la URL destino
    router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
    });

    return false;
};
