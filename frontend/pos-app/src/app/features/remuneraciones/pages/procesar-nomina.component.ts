import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-procesar-nomina',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/remuneraciones" class="back-link">← Volver</a>
        <h1>▶️ Procesar Nómina</h1>
      </header>

      <div class="process-section">
        <h2>Período: Diciembre 2024</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Empleados a procesar</span>
            <span class="info-value">{{ employeeCount() }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Días trabajados</span>
            <span class="info-value">30</span>
          </div>
        </div>

        <div class="actions-row">
          <button class="btn btn-secondary" (click)="calculatePayroll()">🔢 Calcular Nómina</button>
          <button class="btn btn-primary" [disabled]="!isCalculated()" (click)="approvePayroll()">✅ Aprobar y Generar</button>
        </div>

        @if (isCalculated()) {
          <div class="summary-card">
            <h3>Resumen del Cálculo</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">Total Bruto</span>
                <span class="summary-value">{{ totalGross() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">AFP</span>
                <span class="summary-value deduction">{{ totalAfp() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Salud</span>
                <span class="summary-value deduction">{{ totalHealth() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Impuestos</span>
                <span class="summary-value deduction">{{ totalTax() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              </div>
              <div class="summary-item highlight">
                <span class="summary-label">Total Líquido a Pagar</span>
                <span class="summary-value net">{{ totalNet() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { margin-bottom: 24px; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; display: block; margin-bottom: 8px; }
    h1, h2, h3 { color: #fff; margin: 0; }
    h2 { font-size: 1.25rem; margin-bottom: 20px; }
    h3 { font-size: 1.1rem; margin-bottom: 16px; }
    .process-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; max-width: 600px; }
    .info-grid { display: flex; gap: 32px; margin-bottom: 24px; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .info-value { color: #fff; font-size: 1.5rem; font-weight: 700; }
    .actions-row { display: flex; gap: 16px; margin-bottom: 24px; }
    .btn { padding: 14px 28px; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }
    .summary-card { background: rgba(74,222,128,0.05); border: 1px solid rgba(74,222,128,0.2); border-radius: 12px; padding: 20px; }
    .summary-grid { display: flex; flex-direction: column; gap: 12px; }
    .summary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .summary-item.highlight { border: none; padding-top: 16px; margin-top: 8px; border-top: 2px solid rgba(74,222,128,0.3); }
    .summary-label { color: rgba(255,255,255,0.7); }
    .summary-value { color: #fff; font-weight: 600; }
    .summary-value.deduction { color: #f87171; }
    .summary-value.net { color: #4ade80; font-size: 1.25rem; }
  `]
})
export class ProcesarNominaComponent {
    employeeCount = signal(18);
    isCalculated = signal(false);
    totalGross = signal(0);
    totalAfp = signal(0);
    totalHealth = signal(0);
    totalTax = signal(0);
    totalNet = signal(0);

    calculatePayroll(): void {
        this.totalGross.set(12500000);
        this.totalAfp.set(1437500);
        this.totalHealth.set(875000);
        this.totalTax.set(312500);
        this.totalNet.set(9875000);
        this.isCalculated.set(true);
    }

    approvePayroll(): void {
        console.log('Approve payroll');
    }
}
