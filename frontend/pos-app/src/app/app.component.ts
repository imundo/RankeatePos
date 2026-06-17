import { Component, inject, signal, computed, effect } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { filter } from 'rxjs/operators';
import { OfflineService } from './core/offline/offline.service';
import { AuthService } from './core/auth/auth.service';
import { BottomNavComponent, NavItem } from './shared/components/bottom-nav/bottom-nav.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, ToastModule, BottomNavComponent],
    providers: [MessageService],
    template: `
    <!-- Offline Indicator -->
    @if (isOffline()) {
      <div class="offline-indicator">
        <i class="pi pi-wifi" style="margin-right: 0.5rem;"></i>
        Sin conexión - Las ventas se guardarán localmente
      </div>
    }
    
    <!-- Toast notifications -->
    <p-toast position="top-right"></p-toast>
    
    <!-- Main content -->
    <div class="app-content" [class.has-bottom-nav]="showBottomNav()">
      <router-outlet></router-outlet>
    </div>

    <!-- Global Mobile Bottom Navigation -->
    @if (showBottomNav()) {
      <app-bottom-nav 
        [items]="globalNavItems"
        [showFab]="true"
        fabIcon="plus"
        (fabClick)="onGlobalFabClick()">
      </app-bottom-nav>
    }
  `,
    styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--surface-ground);
      --bottom-nav-height: 72px;
    }
    .app-content {
      height: 100%;
    }
    .app-content.has-bottom-nav {
      /* Add padding at the bottom so content isn't hidden behind the bottom nav */
      padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0));
    }
    @media (min-width: 768px) {
      .app-content.has-bottom-nav {
        padding-bottom: 0;
      }
    }
  `]
})
export class AppComponent {
    private offlineService = inject(OfflineService);
    private authService = inject(AuthService);
    private router = inject(Router);

    isOffline = this.offlineService.isOffline;
    currentUrl = signal('');

    showBottomNav = computed(() => {
        // Solo mostrar si está autenticado y NO está en login
        if (!this.authService.isAuthenticated()) return false;
        if (this.currentUrl().includes('/auth/login')) return false;
        return true;
    });

    globalNavItems: NavItem[] = [
        { route: '/dashboard', icon: 'layout-dashboard', label: 'Inicio' },
        { route: '/inventory', icon: 'package', label: 'Inventario' },
        { route: '/compras', icon: 'shopping-cart', label: 'Compras' },
        { route: '/compras/proveedores', icon: 'truck', label: 'Proveedores' },
        { route: '/analytics', icon: 'bar-chart-2', label: 'Analítica' },
        { route: '/settings', icon: 'settings', label: 'Config' }
    ];

    constructor() {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.currentUrl.set(event.urlAfterRedirects);
        });

        // Efecto para mostrar notificación cuando cambia el estado de conexión
        effect(() => {
            const offline = this.isOffline();
            if (offline) {
                console.log('Modo offline activado');
            } else {
                console.log('Conexión restaurada');
            }
        });
    }

    onGlobalFabClick() {
        // Redirigir a POS o alguna acción rápida
        this.router.navigate(['/pos']);
    }
}
