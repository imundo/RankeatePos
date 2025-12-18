import { Component, inject, signal, computed, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { OfflineService } from './core/offline/offline.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, ToastModule],
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
    <router-outlet></router-outlet>
  `,
    styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class AppComponent {
    private offlineService = inject(OfflineService);

    isOffline = this.offlineService.isOffline;

    constructor() {
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
}
