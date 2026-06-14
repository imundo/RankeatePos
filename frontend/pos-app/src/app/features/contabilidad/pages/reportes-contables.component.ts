import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-reportes-contables',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <button class="btn-back" routerLink="/contabilidad" style="width: 44px; height: 44px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        <h1>📈 Reportes Contables</h1>
      </header>

      <div class="reports-grid">
        <div class="report-card" (click)="generateReport('balance')">
          <span class="report-icon">📊</span>
          <h3>Balance General</h3>
          <p>Estado de situación financiera</p>
        </div>
        <div class="report-card" (click)="generateReport('income')">
          <span class="report-icon">💹</span>
          <h3>Estado de Resultados</h3>
          <p>Ingresos, costos y gastos</p>
        </div>
        <div class="report-card" (click)="generateReport('ledger')">
          <span class="report-icon">📒</span>
          <h3>Libro Mayor</h3>
          <p>Movimientos por cuenta</p>
        </div>
        <div class="report-card" (click)="generateReport('trial')">
          <span class="report-icon">⚖️</span>
          <h3>Balance de Comprobación</h3>
          <p>Verificación de saldos</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container {
      padding: 24px;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
    }

    .page-header {
      margin-bottom: 32px;
    }

    .back-link {
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      display: block;
      margin-bottom: 8px;
    }

    h1 {
      color: #fff;
      font-size: 1.75rem;
      margin: 0;
    }

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .report-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .report-card:hover {
      background: rgba(255,255,255,0.08);
      transform: translateY(-4px);
      border-color: #667eea;
    }

    .report-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 16px;
    }

    .report-card h3 {
      color: #fff;
      margin: 0 0 8px;
    }

    .report-card p {
      color: rgba(255,255,255,0.5);
      margin: 0;
      font-size: 0.9rem;
    }
  `]
})
export class ReportesContablesComponent {
    generateReport(type: string): void {
        console.log('Generate report:', type);
    }
}
