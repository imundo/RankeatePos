import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-ejecucion-presupuesto',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/presupuesto" class="back-link">← Volver</a>
        <h1>📋 Ejecución Presupuestaria</h1>
      </header>
      <div class="form-section">
        <p class="placeholder">Vista detallada de ejecución presupuestaria por cuenta</p>
      </div>
    </div>
  `,
    styles: [`.page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); } .page-header { margin-bottom: 24px; } .back-link { color: rgba(255,255,255,0.6); text-decoration: none; display: block; margin-bottom: 8px; } h1 { color: #fff; margin: 0; } .form-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 48px; text-align: center; } .placeholder { color: rgba(255,255,255,0.5); }`]
})
export class EjecucionPresupuestoComponent { }
