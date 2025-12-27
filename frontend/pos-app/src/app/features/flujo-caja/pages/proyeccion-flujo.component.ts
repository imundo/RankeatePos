import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-proyeccion-flujo',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/flujo-caja" class="back-link">← Volver</a>
        <h1>📊 Proyección de Flujo de Caja</h1>
      </header>
      <div class="content-section">
        <p class="placeholder">Gráfico de proyección de flujo de caja a 90 días</p>
      </div>
    </div>
  `,
    styles: [`.page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); } .page-header { margin-bottom: 24px; } .back-link { color: rgba(255,255,255,0.6); text-decoration: none; display: block; margin-bottom: 8px; } h1 { color: #fff; margin: 0; } .content-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 48px; text-align: center; } .placeholder { color: rgba(255,255,255,0.5); }`]
})
export class ProyeccionFlujoComponent { }
