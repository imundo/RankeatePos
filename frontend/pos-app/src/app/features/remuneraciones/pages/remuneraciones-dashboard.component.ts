import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-remuneraciones-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>👥 Remuneraciones</h1>
        <p class="subtitle">Gestión de sueldos y nómina</p>
      </header>

      <!-- KPIs -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-icon">👤</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ employeeCount() }}</span>
            <span class="kpi-label">Empleados Activos</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">💰</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ monthlyPayroll() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            <span class="kpi-label">Nómina Mensual</span>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">📅</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ currentPeriod() }}</span>
            <span class="kpi-label">Período Actual</span>
          </div>
        </div>
        <div class="kpi-card" [class.warning]="pendingPayslips() > 0">
          <span class="kpi-icon">⏳</span>
          <div class="kpi-content">
            <span class="kpi-value">{{ pendingPayslips() }}</span>
            <span class="kpi-label">Liquidaciones Pendientes</span>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <section class="actions-grid">
        <a routerLink="empleados" class="action-card">
          <span class="action-icon">👥</span>
          <span class="action-label">Empleados</span>
        </a>
        <a routerLink="liquidaciones" class="action-card">
          <span class="action-icon">📄</span>
          <span class="action-label">Liquidaciones</span>
        </a>
        <a routerLink="procesar-nomina" class="action-card primary">
          <span class="action-icon">▶️</span>
          <span class="action-label">Procesar Nómina</span>
        </a>
        <a href="#" class="action-card">
          <span class="action-icon">📊</span>
          <span class="action-label">Previred</span>
        </a>
      </section>

      <!-- Payroll Status -->
      <section class="status-section">
        <h3>Estado del Período {{ currentPeriod() }}</h3>
        <div class="status-bar">
          <div class="status-step completed">
            <span class="step-icon">✓</span>
            <span class="step-label">Datos</span>
          </div>
          <div class="status-connector completed"></div>
          <div class="status-step current">
            <span class="step-icon">2</span>
            <span class="step-label">Cálculo</span>
          </div>
          <div class="status-connector"></div>
          <div class="status-step">
            <span class="step-icon">3</span>
            <span class="step-label">Aprobación</span>
          </div>
          <div class="status-connector"></div>
          <div class="status-step">
            <span class="step-icon">4</span>
            <span class="step-label">Pago</span>
          </div>
        </div>
      </section>
    </div>
  `,
    styles: [`
    .dashboard-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .dashboard-header { margin-bottom: 24px; }
    .dashboard-header h1 { color: #fff; font-size: 2rem; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.6); margin-top: 4px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .kpi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; display: flex; gap: 16px; }
    .kpi-card.warning { border-color: rgba(251,191,36,0.5); }
    .kpi-icon { font-size: 2rem; }
    .kpi-content { display: flex; flex-direction: column; }
    .kpi-value { color: #fff; font-size: 1.5rem; font-weight: 700; }
    .kpi-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .action-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; text-decoration: none; transition: all 0.3s; }
    .action-card:hover { background: rgba(255,255,255,0.08); transform: translateY(-2px); }
    .action-card.primary { background: linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%); border-color: rgba(102,126,234,0.4); }
    .action-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
    .action-label { color: #fff; font-weight: 500; }
    .status-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; }
    .status-section h3 { color: #fff; margin: 0 0 24px; }
    .status-bar { display: flex; align-items: center; justify-content: center; gap: 0; }
    .status-step { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .step-icon { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); font-size: 1rem; }
    .status-step.completed .step-icon { background: rgba(74,222,128,0.2); color: #4ade80; }
    .status-step.current .step-icon { background: rgba(102,126,234,0.2); color: #667eea; border: 2px solid #667eea; }
    .step-label { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
    .status-step.current .step-label { color: #667eea; }
    .status-connector { width: 80px; height: 2px; background: rgba(255,255,255,0.1); }
    .status-connector.completed { background: rgba(74,222,128,0.5); }
  `]
})
export class RemuneracionesDashboardComponent {
    employeeCount = signal(18);
    monthlyPayroll = signal(12500000);
    currentPeriod = signal('Diciembre 2024');
    pendingPayslips = signal(3);
}
