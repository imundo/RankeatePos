import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { MessageService } from 'primeng/api';

/**
 * Module guard factory — returns a CanActivateFn that checks
 * whether the tenant has the specified module enabled.
 *
 * Usage in routes:
 *   canActivate: [authGuard, moduleGuard('inventory')]
 */
export function moduleGuard(moduleCode: string): CanActivateFn {
    return (route, state) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        // Super admins bypass module checks
        if (authService.hasRole('SAAS_ADMIN')) {
            return true;
        }

        // Check if tenant has this module enabled
        if (authService.hasModule(moduleCode)) {
            return true;
        }

        // Module not available — redirect to POS with a message
        console.warn(`[ModuleGuard] Module '${moduleCode}' not available for tenant. Redirecting to /pos`);

        // Try to show a toast (may not work if MessageService not available at guard level)
        try {
            const messageService = inject(MessageService);
            messageService.add({
                severity: 'warn',
                summary: 'Módulo no disponible',
                detail: `El módulo "${moduleCode}" no está habilitado para tu empresa.`,
                life: 4000
            });
        } catch {
            // MessageService not available at this level — silent redirect
        }

        router.navigate(['/pos']);
        return false;
    };
}
