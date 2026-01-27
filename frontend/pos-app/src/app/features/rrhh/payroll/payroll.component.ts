import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PayrollService, Payroll } from '@app/core/services/payroll.service';
import { DemoDataService } from '@app/core/services/demo-data.service';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, CardModule, TagModule, TooltipModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="payroll-container fade-in">
      <div class="page-header">
        <div class="header-content">
          <h1>💰 Remuneraciones</h1>
          <p class="subtitle">Gestión de nómina, liquidaciones y pagos</p>
        </div>
        <div class="header-actions">
           <button pButton label="Reportes" icon="pi pi-chart-bar" class="p-button-outlined p-button-secondary"></button>
           <button pButton label="Calcular Mes Actual" icon="pi pi-cog" class="p-button-rounded p-button-warning" 
                   (click)="calculateCurrentMonth()" [loading]="loading()"></button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card glass-card">
           <div class="stat-icon" style="background: linear-gradient(135deg, #10B981, #34D399);">
            <i class="pi pi-dollar"></i>
           </div>
           <div class="stat-info">
             <span class="stat-value">{{ formatMoney(totalPayroll()) }}</span>
             <span class="stat-label">Total Nómina</span>
           </div>
        </div>
        <div class="stat-card glass-card">
           <div class="stat-icon" style="background: linear-gradient(135deg, #8B5CF6, #A78BFA);">
            <i class="pi pi-users"></i>
           </div>
           <div class="stat-info">
             <span class="stat-value">{{ payrolls().length }}</span>
             <span class="stat-label">Empleados</span>
           </div>
        </div>
        <div class="stat-card glass-card" [class.warning-state]="hasPending()">
           <div class="stat-icon" style="background: linear-gradient(135deg, #F59E0B, #FBBF24);">
            <i class="pi pi-clock"></i>
           </div>
           <div class="stat-info">
             <span class="stat-value">{{ hasPending() ? 'Pendiente' : 'Al Día' }}</span>
             <span class="stat-label">Estado Mes Actual</span>
           </div>
        </div>
      </div>

      <div class="glass-card table-wrapper">
        <div class="card-header">
            <h3>Historial de Liquidaciones</h3>
            <div class="actions">
                <span class="p-input-icon-left">
                    <i class="pi pi-search"></i>
                    <input type="text" pInputText placeholder="Buscar empleado..." class="search-input" />
                </span>
            </div>
        </div>
        
        <p-table [value]="payrolls()" [tableStyle]="{'min-width': '60rem'}" styleClass="p-datatable-sm" [rowHover]="true" [loading]="loading()">
          <ng-template pTemplate="header">
            <tr>
              <th>Empleado</th>
              <th>Periodo</th>
              <th class="text-right">Sueldo Base</th>
              <th class="text-right">Bonos</th>
              <th class="text-right">Descuentos</th>
              <th class="text-right">Líquido Pagar</th>
              <th class="text-center">Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-pay>
            <tr class="row-hover">
              <td>
                <div class="flex flex-column">
                    <span class="font-bold text-white">{{ pay.employee?.firstName }} {{ pay.employee?.lastName }}</span>
                    <span class="text-xs text-gray-400">{{ pay.employee?.position || 'Colaborador' }}</span>
                </div>
              </td>
              <td class="text-gray-300">{{ pay.periodStart | date:'MMM yyyy':'':'es-CL' | titlecase }}</td>
              <td class="text-right font-mono">{{ formatMoney(pay.baseSalary) }}</td>
              <td class="text-right font-mono text-green-400">+{{ formatMoney(pay.totalBonuses) }}</td>
              <td class="text-right font-mono text-red-400">-{{ formatMoney(pay.totalDiscounts) }}</td>
              <td class="text-right">
                <span class="liquid-amount">{{ formatMoney(pay.totalPaid) }}</span>
              </td>
              <td class="text-center">
                <p-tag [value]="pay.status" [severity]="pay.status === 'PAID' ? 'success' : 'warning'" [rounded]="true"></p-tag>
              </td>
              <td class="text-center">
                <div class="action-buttons">
                    <button pButton icon="pi pi-file-pdf" class="p-button-text p-button-rounded p-button-sm p-button-secondary" pTooltip="Ver Liquidación"></button>
                    <button pButton icon="pi pi-check-circle" class="p-button-text p-button-rounded p-button-sm p-button-success" 
                            *ngIf="pay.status !== 'PAID'" pTooltip="Marcar Pagado"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
             <tr>
               <td colspan="8" class="text-center p-4">No hay liquidaciones generadas aun.</td>
             </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .payroll-container {
      padding: 2rem;
      background: radial-gradient(circle at top right, rgba(16, 185, 129, 0.1), transparent 40%),
                  radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.1), transparent 40%);
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 1.5rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -1px;
      background: linear-gradient(135deg, #fff 30%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .subtitle { 
        color: #94A3B8; 
        margin-top: 0.5rem; 
        font-size: 1.1rem;
    }
    
    .header-actions {
        display: flex;
        gap: 1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.75rem;
      position: relative;
      overflow: hidden;
    }
    
    .stat-icon {
        width: 60px; height: 60px;
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        i { font-size: 1.75rem; color: white; }
    }
    
    .stat-info {
        z-index: 1;
    }
    
    .stat-value {
        font-size: 1.8rem;
        font-weight: 800;
        color: white;
        display: block;
        margin-bottom: 0.25rem;
    }
    
    .stat-label {
        font-size: 0.9rem;
        color: #94A3B8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
    }

    .glass-card {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .warning-state {
        border-color: rgba(245, 158, 11, 0.3);
        background: rgba(245, 158, 11, 0.05);
    }
    
    .table-wrapper {
        padding: 1.5rem;
    }
    
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        
        h3 { margin: 0; color: white; font-size: 1.25rem; }
    }
    
    .search-input {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 8px;
        padding: 0.5rem 0.5rem 0.5rem 2.5rem;
        width: 250px;
        
        &:focus {
            border-color: #818CF8;
            outline: none;
        }
    }
    
    .liquid-amount {
        font-weight: 700;
        font-size: 1.1rem;
        color: #fff;
    }
    
    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
    }
    
    .text-right { text-align: right; }
    .text-center { text-align: center; }
  `]
})
export class PayrollComponent implements OnInit {
  private payrollService = inject(PayrollService);
  private messageService = inject(MessageService);
  private demoDataService = inject(DemoDataService);

  payrolls = signal<Payroll[]>([]);
  loading = signal(false);

  totalPayroll = signal(0);
  hasPending = signal(false);

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.loading.set(true);
    this.payrollService.getHistory().subscribe({
      next: (data) => {
        if (data.length === 0) {
          this.loadDemoPayrolls();
        } else {
          this.payrolls.set(data);
          this.calculateStats(data);
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error(err);
        this.loadDemoPayrolls();
      }
    });
  }

  loadDemoPayrolls() {
    const employees = this.demoDataService.getTenantDemoData('demo').rrhh?.employees || [];
    const mockPayrolls: any[] = employees.map((emp: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      employee: emp,
      periodStart: new Date().toISOString(),
      baseSalary: 500000 + Math.floor(Math.random() * 500000),
      totalBonuses: Math.floor(Math.random() * 100000),
      totalDiscounts: Math.floor(Math.random() * 50000),
      totalPaid: 0,
      status: Math.random() > 0.3 ? 'PAID' : 'PENDING'
    }));

    mockPayrolls.forEach(p => p.totalPaid = p.baseSalary + p.totalBonuses - p.totalDiscounts);

    this.payrolls.set(mockPayrolls);
    this.calculateStats(mockPayrolls);
    this.loading.set(false);
  }

  calculateStats(data: Payroll[]) {
    const total = data.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0);
    this.totalPayroll.set(total);

    const pending = data.some(p => p.status !== 'PAID');
    this.hasPending.set(pending);
  }

  calculateCurrentMonth() {
    const now = new Date();
    this.loading.set(true);
    this.payrollService.calculateMonthly(now.getFullYear(), now.getMonth() + 1).subscribe({
      next: (run) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Nómina calculada correctamente' });
        this.loadHistory();
      },
      error: (err) => {
        // Fallback demo simulation
        setTimeout(() => {
          this.messageService.add({ severity: 'success', summary: 'Demo', detail: 'Nómina calculada (Simulación)' });
          this.loadHistory();
          this.loading.set(false);
        }, 1500);
      }
    });
  }

  formatMoney(amount: number) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
  }
}
