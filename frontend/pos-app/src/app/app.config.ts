import { ApplicationConfig, provideZoneChangeDetection, isDevMode, importProvidersFrom } from '@angular/core';
import { LucideAngularModule, Building2, MapPin, Phone, Mail, Plus, Edit2, Trash2, CheckCircle2, Star } from 'lucide-angular';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { branchContextInterceptor } from './core/interceptors/branch-context.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes, withPreloading(PreloadAllModules)),
        provideHttpClient(
            withInterceptors([authInterceptor, branchContextInterceptor, errorInterceptor])
        ),
        provideAnimations(),
        provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
        }),
        importProvidersFrom(LucideAngularModule.pick({
            Building2, MapPin, Phone, Mail, Plus, Edit2, Trash2, CheckCircle2, Star
        }))
    ]
};
