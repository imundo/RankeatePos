import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-payroll',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, CardModule, TagModule],
    template: `
    <div class="payroll-container fade-in">
      <div class="page-header">
        <div class="header-content">
          <h1>💰 Remuneraciones</h1>
          <p class="subtitle">Generación y pago de sueldos</p>
        </div>
        <button pButton label="Generar Nómina" icon="pi pi-cog" class="p-button-rounded p-button-warning"></button>
      </div>

      <div class="stats-cards">
        <div class="stat-card glass-panel">
          <span class="label">Total a Pagar</span>
          <span class="value">{{ formatMoney(4250000) }}</span>
        </div>
        <div class="stat-card glass-panel">
          <span class="label">Empleados</span>
          <span class="value">5</span>
        </div>
        <div class="stat-card glass-panel">
          <span class="label">Estado Mes</span>
          <p-tag value="Pendiente" severity="warning"></p-tag>
        </div>
      </div>

      <p-card styleClass="glass-card mt-4">
        <p-table [value]="payrolls()" [tableStyle]="{'min-width': '60rem'}">
          <ng-template pTemplate="header">
            <tr>
              <th>Empleado</th>
              <th>Periodo</th>
              <th>Sueldo Base</th>
              <th>Bonos</th>
              <th>Descuentos</th>
              <th>Líquido</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-pay>
            <tr>
              <td class="font-bold">{{ pay.employee }}</td>
              <td>{{ pay.period }}</td>
              <td>{{ formatMoney(pay.base) }}</td>
              <td class="text-green-400">+{{ formatMoney(pay.bonus) }}</td>
              <td class="text-red-400">-{{ formatMoney(pay.deductions) }}</td>
              <td class="font-bold text-xl">{{ formatMoney(pay.total) }}</td>
              <td><p-tag [value]="pay.status" [severity]="pay.status === 'PAGADO' ? 'success' : 'warning'"></p-tag></td>
              <td>
                <button pButton icon="pi pi-file-pdf" class="p-button-text p-button-rounded"></button>
                <button pButton icon="pi pi-check" class="p-button-text p-button-rounded p-button-success" *ngIf="pay.status !== 'PAGADO'"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `,
    styles: [`
    .payroll-container {
      padding: 2rem;
      background: var(--surface-card);
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 1.8rem;
      background: linear-gradient(90deg, #10B981, #34D399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle { color: var(--text-secondary-color); margin-top: 0.5rem; }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      .label { color: #94A3B8; font-size: 0.9rem; }
      .value { font-size: 1.8rem; font-weight: 700; color: white; }
    }
  `]
})
export class PayrollComponent {
    payrolls = signal([
        { employee: 'Juan Pérez', period: 'Enero 2026', base: 850000, bonus: 50000, deductions: 170000, total: 730000, status: 'PENDIENTE' },
        { employee: 'Maria Soto', period: 'Enero 2026', base: 550000, bonus: 25000, deductions: 110000, total: 465000, status: 'PAGADO' },
    ]);

    formatMoney(amount: number) {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    }
}
