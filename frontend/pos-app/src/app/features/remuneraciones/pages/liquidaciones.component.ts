import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-liquidaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/remuneraciones" class="back-link">← Volver</a>
        <h1>📄 Liquidaciones de Sueldo</h1>
      </header>

      <div class="period-selector">
        <select [(ngModel)]="selectedPeriod" class="form-control">
          <option value="2024-12">Diciembre 2024</option>
          <option value="2024-11">Noviembre 2024</option>
          <option value="2024-10">Octubre 2024</option>
        </select>
      </div>

      <div class="payslips-table">
        <div class="table-header">
          <span>Empleado</span>
          <span>Sueldo Bruto</span>
          <span>Descuentos</span>
          <span>Líquido</span>
          <span>Acciones</span>
        </div>
        <div class="table-body">
          @for (slip of payslips(); track slip.id) {
            <div class="table-row">
              <span class="emp-name">{{ slip.employeeName }}</span>
              <span class="amount">{{ slip.gross | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="amount deductions">{{ slip.deductions | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="amount net">{{ slip.net | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span class="actions">
                <button class="action-btn" (click)="viewPayslip(slip)" title="Ver">👁️</button>
                <button class="action-btn" (click)="downloadPayslip(slip)" title="Descargar">📥</button>
              </span>
            </div>
          }
        </div>
      </div>

      <div class="totals-row">
        <span class="total-label">TOTALES:</span>
        <span class="total-value">{{ totalGross() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
        <span class="total-value deductions">{{ totalDeductions() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
        <span class="total-value net">{{ totalNet() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { margin-bottom: 24px; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; display: block; margin-bottom: 8px; }
    h1 { color: #fff; margin: 0; }
    .period-selector { margin-bottom: 24px; }
    .form-control { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 16px; color: #fff; min-width: 200px; }
    .form-control option { background: #1a1a3e; }
    .payslips-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 100px; gap: 12px; padding: 14px 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .table-body { max-height: 50vh; overflow-y: auto; }
    .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 100px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; align-items: center; }
    .emp-name { font-weight: 500; }
    .amount { text-align: right; }
    .amount.deductions { color: #f87171; }
    .amount.net { color: #4ade80; font-weight: 600; }
    .actions { display: flex; gap: 8px; }
    .action-btn { background: rgba(255,255,255,0.05); border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
    .totals-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 100px; gap: 12px; padding: 16px 20px; margin-top: 16px; background: rgba(102,126,234,0.1); border-radius: 12px; font-weight: 700; }
    .total-label { color: rgba(255,255,255,0.7); }
    .total-value { color: #fff; text-align: right; }
    .total-value.deductions { color: #f87171; }
    .total-value.net { color: #4ade80; }
  `]
})
export class LiquidacionesComponent {
  selectedPeriod = '2024-12';

  payslips = signal([
    { id: '1', employeeName: 'Juan Pérez González', gross: 750000, deductions: 142500, net: 607500 },
    { id: '2', employeeName: 'María López Soto', gross: 580000, deductions: 110200, net: 469800 },
    { id: '3', employeeName: 'Carlos Muñoz Vera', gross: 520000, deductions: 98800, net: 421200 },
    { id: '4', employeeName: 'Ana Torres Rivera', gross: 920000, deductions: 174800, net: 745200 }
  ]);

  totalGross = signal(2770000);
  totalDeductions = signal(526300);
  totalNet = signal(2243700);

  viewPayslip(slip: any): void { console.log('View:', slip.id); }
  downloadPayslip(slip: any): void { console.log('Download:', slip.id); }
}
