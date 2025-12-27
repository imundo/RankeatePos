import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-remuneraciones-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>👥 Remuneraciones</h1>
        <p class="subtitle">Gestión de sueldos y nómina</p>
        <span class="live-badge" *ngIf="isLive()">🔴 LIVE</span>
      </header>

      <!-- Loading -->
      <div class="loading-overlay" *ngIf="loading()">
        <div class="spinner"></div>
        <span>Cargando datos...</span>
      </div>

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
        <a (click)="exportPrevired()" class="action-card" style="cursor: pointer;">
          <span class="action-icon">📊</span>
          <span class="action-label">Exportar Previred</span>
        </a>
      </section>

      <!-- Recent Employees -->
      <section class="employees-section">
        <h3>Empleados Recientes</h3>
        <div class="employees-list">
          @for (emp of employees(); track emp.rut) {
            <div class="employee-item">
              <div class="employee-avatar">{{ getInitials(emp.fullName) }}</div>
              <div class="employee-info">
                <span class="employee-name">{{ emp.fullName }}</span>
                <span class="employee-position">{{ emp.position }}</span>
              </div>
              <span class="employee-salary">{{ emp.baseSalary | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            </div>
          }
        </div>
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
          <div class="status-step" [class.current]="periodStatus() === 'PROCESSING'" [class.completed]="periodStatus() === 'PAID'">
            <span class="step-icon">{{ periodStatus() === 'PROCESSING' ? '2' : periodStatus() === 'PAID' ? '✓' : '2' }}</span>
            <span class="step-label">Cálculo</span>
          </div>
          <div class="status-connector" [class.completed]="periodStatus() === 'PAID'"></div>
          <div class="status-step" [class.completed]="periodStatus() === 'PAID'">
            <span class="step-icon">{{ periodStatus() === 'PAID' ? '✓' : '3' }}</span>
            <span class="step-label">Aprobación</span>
          </div>
          <div class="status-connector" [class.completed]="periodStatus() === 'PAID'"></div>
          <div class="status-step" [class.completed]="periodStatus() === 'PAID'">
            <span class="step-icon">{{ periodStatus() === 'PAID' ? '✓' : '4' }}</span>
            <span class="step-label">Pago</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .dashboard-header { margin-bottom: 24px; position: relative; }
    .dashboard-header h1 { color: #fff; font-size: 2rem; margin: 0; }
    .subtitle { color: rgba(255,255,255,0.6); margin-top: 4px; }
    .live-badge { position: absolute; right: 0; top: 0; background: rgba(239,68,68,0.2); color: #ef4444; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .loading-overlay { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 48px; color: rgba(255,255,255,0.6); }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .kpi-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; display: flex; gap: 16px; transition: all 0.3s; }
    .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
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
    .employees-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    .employees-section h3 { color: #fff; margin: 0 0 16px; }
    .employees-list { display: flex; flex-direction: column; gap: 12px; }
    .employee-item { display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: rgba(255,255,255,0.02); border-radius: 10px; }
    .employee-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; }
    .employee-info { flex: 1; display: flex; flex-direction: column; }
    .employee-name { color: #fff; font-weight: 500; }
    .employee-position { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    .employee-salary { color: #4ade80; font-weight: 600; }
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
export class RemuneracionesDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/payroll`;

  loading = signal(false);
  isLive = signal(false);

  employeeCount = signal(0);
  monthlyPayroll = signal(0);
  currentPeriod = signal('Diciembre 2025');
  pendingPayslips = signal(0);
  periodStatus = signal('PROCESSING');
  employees = signal<any[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    // Load employees
    this.http.get<any[]>(`${this.baseUrl}/employees?active=true`).subscribe({
      next: (emps) => {
        this.employees.set(emps || []);
        this.employeeCount.set(emps?.length || 5);

        // Calculate total payroll
        const total = emps?.reduce((sum, e) => sum + (e.baseSalary || 0), 0) || 0;
        this.monthlyPayroll.set(total);
        this.isLive.set(true);
      },
      error: () => {
        this.employees.set([
          { rut: '12.345.678-9', fullName: 'María González', position: 'Gerente', baseSalary: 2800000 },
          { rut: '11.222.333-4', fullName: 'Juan Pérez', position: 'Desarrollador', baseSalary: 2200000 },
          { rut: '10.111.222-3', fullName: 'Ana López', position: 'Contadora', baseSalary: 2000000 },
          { rut: '9.888.777-6', fullName: 'Pedro Martínez', position: 'Vendedor', baseSalary: 1200000 },
          { rut: '8.777.666-5', fullName: 'Carmen Torres', position: 'Administrativa', baseSalary: 950000 }
        ]);
        this.employeeCount.set(5);
        this.monthlyPayroll.set(9150000);
      }
    });

    // Load periods
    this.http.get<any[]>(`${this.baseUrl}/periods`).subscribe({
      next: (periods) => {
        if (periods && periods.length > 0) {
          const current = periods[0];
          this.currentPeriod.set(current.periodName || 'Diciembre 2025');
          this.periodStatus.set(current.status || 'PROCESSING');
          this.pendingPayslips.set(current.status === 'PROCESSING' ? 5 : 0);
        }
        this.loading.set(false);
      },
      error: () => {
        this.currentPeriod.set('Diciembre 2025');
        this.periodStatus.set('PROCESSING');
        this.pendingPayslips.set(5);
        this.loading.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
  }

  exportPrevired(): void {
    window.open(`${this.baseUrl}/previred/current`, '_blank');
  }
}
