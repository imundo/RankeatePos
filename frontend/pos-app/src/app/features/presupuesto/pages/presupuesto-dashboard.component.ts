import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-presupuesto-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>📊 Presupuesto</h1>
        <p class="subtitle">Control y seguimiento presupuestario</p>
      </header>

      <!-- Period Selector -->
      <div class="period-selector">
        <button class="period-btn" [class.active]="selectedPeriod() === '2024-12'" (click)="selectPeriod('2024-12')">Dic 2024</button>
        <button class="period-btn" [class.active]="selectedPeriod() === '2024-Q4'" (click)="selectPeriod('2024-Q4')">Q4 2024</button>
        <button class="period-btn" [class.active]="selectedPeriod() === '2024'" (click)="selectPeriod('2024')">Año 2024</button>
      </div>

      <!-- KPIs -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-icon">📈</span>
          <div class="kpi-content">
            <span class="kpi-label">Presupuestado</span>
            <span class="kpi-value">{{ budgetTotal() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">💰</span>
          <div class="kpi-content">
            <span class="kpi-label">Ejecutado</span>
            <span class="kpi-value">{{ executedTotal() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          </div>
        </div>
        <div class="kpi-card" [class.positive]="variance() >= 0" [class.negative]="variance() < 0">
          <span class="kpi-icon">{{ variance() >= 0 ? '✅' : '⚠️' }}</span>
          <div class="kpi-content">
            <span class="kpi-label">Variación</span>
            <span class="kpi-value">{{ variance() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            <span class="kpi-percent">{{ variancePercent() | number:'1.1-1' }}%</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">📅</span>
          <div class="kpi-content">
            <span class="kpi-label">Ejecución</span>
            <span class="kpi-value">{{ executionPercent() | number:'1.0-0' }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="executionPercent()"></div>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <section class="actions-grid">
        <a routerLink="crear" class="action-card primary">
          <span class="action-icon">➕</span>
          <span class="action-label">Crear Presupuesto</span>
        </a>
        <a routerLink="ejecutar" class="action-card">
          <span class="action-icon">📋</span>
          <span class="action-label">Ver Ejecución</span>
        </a>
      </section>

      <!-- Budget Summary by Category -->
      <section class="summary-section">
        <h3>Resumen por Categoría</h3>
        <div class="summary-table">
          @for (item of categorySummary(); track item.category) {
            <div class="summary-row">
              <span class="category-name">{{ item.category }}</span>
              <div class="bar-container">
                <div class="bar-budgeted" [style.width.%]="100"></div>
                <div class="bar-executed" [style.width.%]="(item.executed / item.budgeted) * 100"></div>
              </div>
              <span class="amounts">
                {{ item.executed | currency:'CLP':'symbol-narrow':'1.0-0' }} / {{ item.budgeted | currency:'CLP':'symbol-narrow':'1.0-0' }}
              </span>
              <span class="variance-badge" [class.positive]="item.variance >= 0" [class.negative]="item.variance < 0">
                {{ item.variance >= 0 ? '+' : '' }}{{ item.variancePercent | number:'1.0-0' }}%
              </span>
            </div>
          }
        </div>
      </section>
    </div>
  `,
    styles: [`
    .dashboard-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .dashboard-header { margin-bottom: 24px; }
    .dashboard-header h1 { color: #fff; font-size: 2rem; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.6); margin-top: 4px; }
    .period-selector { display: flex; gap: 12px; margin-bottom: 24px; }
    .period-btn { padding: 10px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: rgba(255,255,255,0.7); cursor: pointer; }
    .period-btn.active { background: rgba(102,126,234,0.2); border-color: #667eea; color: #fff; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .kpi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; display: flex; gap: 16px; flex-direction: column; }
    .kpi-card.positive { border-color: rgba(74,222,128,0.4); }
    .kpi-card.negative { border-color: rgba(239,68,68,0.4); }
    .kpi-icon { font-size: 2rem; }
    .kpi-content { display: flex; flex-direction: column; }
    .kpi-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .kpi-value { color: #fff; font-size: 1.5rem; font-weight: 700; }
    .kpi-percent { color: rgba(255,255,255,0.5); font-size: 0.9rem; }
    .progress-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 8px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 3px; }
    .actions-grid { display: flex; gap: 16px; margin-bottom: 32px; }
    .action-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px 32px; text-align: center; text-decoration: none; }
    .action-card.primary { background: linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%); border-color: rgba(102,126,234,0.4); }
    .action-icon { font-size: 1.5rem; display: block; margin-bottom: 8px; }
    .action-label { color: #fff; font-weight: 500; }
    .summary-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; }
    .summary-section h3 { color: #fff; margin: 0 0 16px; }
    .summary-row { display: grid; grid-template-columns: 150px 1fr 200px 80px; gap: 16px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center; }
    .category-name { color: #fff; font-weight: 500; }
    .bar-container { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; position: relative; }
    .bar-budgeted { position: absolute; height: 100%; background: rgba(255,255,255,0.1); border-radius: 4px; }
    .bar-executed { position: absolute; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 4px; }
    .amounts { color: rgba(255,255,255,0.7); font-size: 0.9rem; text-align: right; }
    .variance-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .variance-badge.positive { background: rgba(74,222,128,0.2); color: #4ade80; }
    .variance-badge.negative { background: rgba(239,68,68,0.2); color: #ef4444; }
  `]
})
export class PresupuestoDashboardComponent {
    selectedPeriod = signal('2024-12');
    budgetTotal = signal(25000000);
    executedTotal = signal(22500000);
    variance = signal(2500000);
    variancePercent = signal(10);
    executionPercent = signal(90);

    categorySummary = signal([
        { category: 'Ingresos', budgeted: 45000000, executed: 42000000, variance: 3000000, variancePercent: -7 },
        { category: 'Costos', budgeted: -15000000, executed: -14500000, variance: 500000, variancePercent: 3 },
        { category: 'Gastos Adm.', budgeted: -3000000, executed: -3200000, variance: -200000, variancePercent: -7 },
        { category: 'Marketing', budgeted: -2000000, executed: -1800000, variance: 200000, variancePercent: 10 }
    ]);

    selectPeriod(period: string): void { this.selectedPeriod.set(period); }
}
