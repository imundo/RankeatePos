import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import {
    StaffService,
    Employee,
    PayrollConfig,
    EmployeeDocument,
    EmployeeHistory,
    LeaveBalance
} from '@app/core/services/staff.service';
import { LeaveService, LeaveRequest } from '@app/core/services/leave.service';

@Component({
    selector: 'app-employee-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        TabViewModule,
        CardModule,
        ButtonModule,
        TagModule,
        AvatarModule,
        TableModule,
        TimelineModule,
        TooltipModule,
        ToastModule,
        DialogModule,
        InputTextModule,
        DropdownModule,
        InputNumberModule,
        FormsModule
    ],
    providers: [MessageService],
    template: `
    <p-toast></p-toast>
    
    <div class="employee-detail-container fade-in" *ngIf="employee()">
      <!-- Header -->
      <div class="detail-header glass-card">
        <div class="header-nav">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/rrhh/staff']"></button>
        </div>
        <div class="header-main">
          <p-avatar [label]="employee()!.initials" shape="circle" size="xlarge" 
                    [style]="{'background': 'linear-gradient(135deg, #6366F1, #8B5CF6)', 'font-size': '2rem'}"></p-avatar>
          <div class="header-info">
            <h1>{{ employee()!.fullName }}</h1>
            <p class="position">{{ employee()!.position }}</p>
            <div class="header-meta">
              <span><i class="pi pi-id-card"></i> {{ employee()!.rut }}</span>
              <span *ngIf="employee()!.email"><i class="pi pi-envelope"></i> {{ employee()!.email }}</span>
              <span *ngIf="employee()!.phone"><i class="pi pi-phone"></i> {{ employee()!.phone }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <p-tag [value]="employee()!.active ? 'Activo' : 'Inactivo'" 
                 [severity]="employee()!.active ? 'success' : 'danger'" class="mr-2"></p-tag>
          <div class="pin-display">
            <span class="pin-label">PIN</span>
            <span class="pin-value">{{ employee()!.pinCode }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-row">
        <div class="stat-card glass-card">
          <i class="pi pi-sun" style="color: #F59E0B; font-size: 1.5rem;"></i>
          <div>
            <span class="stat-value">{{ leaveBalance()?.daysRemaining || 0 }}</span>
            <span class="stat-label">Días vacaciones</span>
          </div>
        </div>
        <div class="stat-card glass-card">
          <i class="pi pi-calendar" style="color: #6366F1; font-size: 1.5rem;"></i>
          <div>
            <span class="stat-value">{{ calculateTenure() }}</span>
            <span class="stat-label">Antigüedad</span>
          </div>
        </div>
        <div class="stat-card glass-card">
          <i class="pi pi-file" style="color: #10B981; font-size: 1.5rem;"></i>
          <div>
            <span class="stat-value">{{ documents().length }}</span>
            <span class="stat-label">Documentos</span>
          </div>
        </div>
        <div class="stat-card glass-card">
          <i class="pi pi-dollar" style="color: #EC4899; font-size: 1.5rem;"></i>
          <div>
            <span class="stat-value">{{ formatMoney(employee()!.baseSalary) }}</span>
            <span class="stat-label">Sueldo Base</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <p-tabView styleClass="detail-tabs">
        <!-- Info General -->
        <p-tabPanel header="Información General" leftIcon="pi pi-user">
          <div class="info-grid">
            <div class="info-section glass-card">
              <h3><i class="pi pi-user"></i> Datos Personales</h3>
              <div class="info-row">
                <span class="label">Fecha Nacimiento</span>
                <span class="value">{{ formatDate(employee()!.birthDate) || 'No registrado' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Nacionalidad</span>
                <span class="value">{{ employee()!.nationality || 'No registrada' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Dirección</span>
                <span class="value">{{ employee()!.address || 'No registrada' }}</span>
              </div>
            </div>

            <div class="info-section glass-card">
              <h3><i class="pi pi-phone"></i> Contacto de Emergencia</h3>
              <div class="info-row">
                <span class="label">Nombre</span>
                <span class="value">{{ employee()!.emergencyContact || 'No registrado' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Teléfono</span>
                <span class="value">{{ employee()!.emergencyPhone || 'No registrado' }}</span>
              </div>
            </div>

            <div class="info-section glass-card">
              <h3><i class="pi pi-wallet"></i> Datos Bancarios</h3>
              <div class="info-row">
                <span class="label">Banco</span>
                <span class="value">{{ employee()!.bankName || 'No registrado' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Número de Cuenta</span>
                <span class="value">{{ employee()!.bankAccountNumber || 'No registrado' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Tipo de Cuenta</span>
                <span class="value">{{ employee()!.bankAccountType || 'No registrado' }}</span>
              </div>
            </div>

            <div class="info-section glass-card">
              <h3><i class="pi pi-briefcase"></i> Datos Laborales</h3>
              <div class="info-row">
                <span class="label">Fecha Ingreso</span>
                <span class="value">{{ formatDate(employee()!.hireDate) }}</span>
              </div>
              <div class="info-row">
                <span class="label">País</span>
                <span class="value">{{ getCountryName(employee()!.countryCode) }}</span>
              </div>
            </div>
          </div>
        </p-tabPanel>

        <!-- Payroll Config -->
        <p-tabPanel header="Configuración Nómina" leftIcon="pi pi-dollar">
          <div class="payroll-grid" *ngIf="payrollConfig()">
            <div class="payroll-section glass-card">
              <h3><i class="pi pi-heart"></i> Salud</h3>
              <div class="info-row">
                <span class="label">Sistema</span>
                <span class="value">{{ payrollConfig()!.healthSystem }}</span>
              </div>
              <div class="info-row" *ngIf="payrollConfig()!.isapreName">
                <span class="label">Isapre</span>
                <span class="value">{{ payrollConfig()!.isapreName }}</span>
              </div>
              <div class="info-row">
                <span class="label">Cotización</span>
                <span class="value">{{ payrollConfig()!.healthRate }}%</span>
              </div>
            </div>

            <div class="payroll-section glass-card">
              <h3><i class="pi pi-chart-line"></i> Pensión</h3>
              <div class="info-row">
                <span class="label">AFP</span>
                <span class="value">{{ payrollConfig()!.afpName }}</span>
              </div>
              <div class="info-row">
                <span class="label">Cotización</span>
                <span class="value">{{ payrollConfig()!.afpRate }}%</span>
              </div>
              <div class="info-row" *ngIf="payrollConfig()!.hasApv">
                <span class="label">APV Mensual</span>
                <span class="value">{{ formatMoney(payrollConfig()!.apvMonthlyAmount!) }}</span>
              </div>
            </div>

            <div class="payroll-section glass-card">
              <h3><i class="pi pi-gift"></i> Asignaciones</h3>
              <div class="info-row" *ngIf="payrollConfig()!.hasLunchAllowance">
                <span class="label">Colación</span>
                <span class="value">{{ formatMoney(payrollConfig()!.lunchAllowanceAmount!) }}</span>
              </div>
              <div class="info-row" *ngIf="payrollConfig()!.hasTransportAllowance">
                <span class="label">Movilización</span>
                <span class="value">{{ formatMoney(payrollConfig()!.transportAllowanceAmount!) }}</span>
              </div>
              <div class="info-row">
                <span class="label">Gratificación</span>
                <span class="value">{{ payrollConfig()!.gratificationType }}</span>
              </div>
            </div>
          </div>
          <button pButton label="Editar Configuración" icon="pi pi-pencil" class="p-button-outlined mt-3"
                  (click)="showPayrollModal = true"></button>
        </p-tabPanel>

        <!-- Leave Balance -->
        <p-tabPanel header="Vacaciones" leftIcon="pi pi-sun">
          <div class="vacation-info" *ngIf="leaveBalance()">
            <div class="vacation-summary glass-card">
              <div class="vacation-circle">
                <svg viewBox="0 0 36 36" class="circular-chart">
                  <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  <path class="circle" [attr.stroke-dasharray]="getVacationPercentage() + ', 100'" 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                </svg>
                <div class="vacation-number">
                  <span class="big">{{ leaveBalance()!.daysRemaining }}</span>
                  <span class="small">días</span>
                </div>
              </div>
              <div class="vacation-details">
                <h3>Balance de Vacaciones {{ leaveBalance()!.year }}</h3>
                <div class="detail-row">
                  <span>Días anuales:</span>
                  <span>{{ leaveBalance()!.daysEntitled }}</span>
                </div>
                <div class="detail-row">
                  <span>Días acumulados:</span>
                  <span>{{ leaveBalance()!.daysAccrued }}</span>
                </div>
                <div class="detail-row">
                  <span>Días tomados:</span>
                  <span>{{ leaveBalance()!.daysTaken }}</span>
                </div>
                <div class="detail-row" *ngIf="leaveBalance()!.carryoverDays > 0">
                  <span>Días trasladados:</span>
                  <span>{{ leaveBalance()!.carryoverDays }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Leave Requests -->
          <h3 class="section-title mt-4">Solicitudes</h3>
          <p-table [value]="leaveRequests()" [paginator]="true" [rows]="5" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Tipo</th>
                <th>Fechas</th>
                <th>Días</th>
                <th>Estado</th>
                <th>Fecha Solicitud</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-request>
              <tr>
                <td>{{ leaveService.getTypeLabel(request.type) }}</td>
                <td>{{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}</td>
                <td>{{ request.daysRequested }}</td>
                <td><p-tag [value]="leaveService.getStatusLabel(request.status)" 
                           [severity]="leaveService.getStatusSeverity(request.status)"></p-tag></td>
                <td>{{ formatDate(request.createdAt) }}</td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr><td colspan="5" class="text-center">Sin solicitudes</td></tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <!-- Documents -->
        <p-tabPanel header="Documentos" leftIcon="pi pi-file">
          <div class="documents-header">
            <button pButton label="Subir Documento" icon="pi pi-upload" class="p-button-outlined"></button>
          </div>
          <div class="documents-grid">
            @for (doc of documents(); track doc.id) {
              <div class="document-card glass-card">
                <div class="doc-icon">
                  <i [class]="getDocumentIcon(doc.mimeType)"></i>
                </div>
                <div class="doc-info">
                  <h4>{{ doc.fileName }}</h4>
                  <span class="doc-type">{{ doc.documentType }}</span>
                  <span class="doc-date">{{ formatDate(doc.uploadedAt) }}</span>
                </div>
                <div class="doc-actions">
                  <button pButton icon="pi pi-download" class="p-button-text p-button-rounded"></button>
                  <button pButton icon="pi pi-trash" class="p-button-text p-button-rounded p-button-danger"></button>
                </div>
              </div>
            }
          </div>
          <div class="empty-state" *ngIf="documents().length === 0">
            <i class="pi pi-file" style="font-size: 3rem; color: var(--text-secondary-color);"></i>
            <p>No hay documentos subidos</p>
          </div>
        </p-tabPanel>

        <!-- History -->
        <p-tabPanel header="Historial" leftIcon="pi pi-history">
          <p-timeline [value]="history()" align="alternate" styleClass="history-timeline">
            <ng-template pTemplate="content" let-event>
              <div class="history-event glass-card">
                <h4>{{ getEventTypeLabel(event.eventType) }}</h4>
                <p>{{ event.description }}</p>
                <div class="change-values" *ngIf="event.previousValue || event.newValue">
                  <span class="old" *ngIf="event.previousValue">{{ event.previousValue }}</span>
                  <i class="pi pi-arrow-right" *ngIf="event.previousValue && event.newValue"></i>
                  <span class="new" *ngIf="event.newValue">{{ event.newValue }}</span>
                </div>
                <span class="event-date">{{ formatDateTime(event.eventDate) }}</span>
              </div>
            </ng-template>
          </p-timeline>
          <div class="empty-state" *ngIf="history().length === 0">
            <i class="pi pi-history" style="font-size: 3rem; color: var(--text-secondary-color);"></i>
            <p>Sin historial registrado</p>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>

    <!-- Loading -->
    <div class="loading-container" *ngIf="loading()">
      <i class="pi pi-spin pi-spinner" style="font-size: 3rem;"></i>
      <p>Cargando información...</p>
    </div>
  `,
    styles: [`
    .employee-detail-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .header-main {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex: 1;
    }

    .header-info {
      h1 { margin: 0; font-size: 1.8rem; }
      .position { 
        color: var(--text-secondary-color); 
        margin: 0.5rem 0;
        font-size: 1.1rem;
      }
    }

    .header-meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.9rem;
      color: var(--text-secondary-color);
      
      span {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      i { color: #6366F1; }
    }

    .header-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 1rem;
    }

    .pin-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(99, 102, 241, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      
      .pin-label { font-size: 0.75rem; color: var(--text-secondary-color); }
      .pin-value { font-size: 1.5rem; font-family: monospace; font-weight: 700; color: #6366F1; }
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;

      .stat-value { font-size: 1.5rem; font-weight: 700; display: block; }
      .stat-label { font-size: 0.85rem; color: var(--text-secondary-color); }
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
    }

    .info-grid, .payroll-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .info-section, .payroll-section {
      padding: 1.5rem;

      h3 {
        margin: 0 0 1rem;
        font-size: 1rem;
        color: #6366F1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);

      .label { color: var(--text-secondary-color); }
      .value { font-weight: 500; }
    }

    .vacation-summary {
      display: flex;
      align-items: center;
      gap: 3rem;
      padding: 2rem;
      max-width: 600px;
    }

    .vacation-circle {
      position: relative;
      width: 150px;
      height: 150px;
    }

    .circular-chart {
      display: block;
      width: 100%;
      height: 100%;

      .circle-bg {
        fill: none;
        stroke: rgba(255, 255, 255, 0.1);
        stroke-width: 3;
      }

      .circle {
        fill: none;
        stroke: #10B981;
        stroke-width: 3;
        stroke-linecap: round;
        animation: progress 1s ease-out forwards;
      }
    }

    .vacation-number {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;

      .big { font-size: 2.5rem; font-weight: 700; display: block; }
      .small { font-size: 0.9rem; color: var(--text-secondary-color); }
    }

    .vacation-details {
      h3 { margin: 0 0 1rem; }

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        min-width: 200px;
      }
    }

    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .document-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;

      .doc-icon {
        width: 50px;
        height: 50px;
        background: rgba(99, 102, 241, 0.1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        i { font-size: 1.5rem; color: #6366F1; }
      }

      .doc-info {
        flex: 1;
        h4 { margin: 0; font-size: 0.95rem; }
        .doc-type, .doc-date { font-size: 0.8rem; color: var(--text-secondary-color); display: block; }
      }
    }

    .history-event {
      padding: 1rem;
      
      h4 { margin: 0 0 0.5rem; color: #6366F1; }
      p { margin: 0; font-size: 0.9rem; }

      .change-values {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
        font-size: 0.85rem;

        .old { color: #EF4444; text-decoration: line-through; }
        .new { color: #10B981; font-weight: 600; }
      }

      .event-date {
        font-size: 0.8rem;
        color: var(--text-secondary-color);
        display: block;
        margin-top: 0.5rem;
      }
    }

    .loading-container, .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary-color);
    }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .detail-header { flex-direction: column; text-align: center; }
      .header-meta { flex-direction: column; gap: 0.5rem; }
    }
  `]
})
export class EmployeeDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private staffService = inject(StaffService);
    leaveService = inject(LeaveService);
    private messageService = inject(MessageService);

    employee = signal<Employee | null>(null);
    payrollConfig = signal<PayrollConfig | null>(null);
    documents = signal<EmployeeDocument[]>([]);
    history = signal<EmployeeHistory[]>([]);
    leaveBalance = signal<LeaveBalance | null>(null);
    leaveRequests = signal<LeaveRequest[]>([]);
    loading = signal(true);
    showPayrollModal = false;

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadEmployee(id);
        }
    }

    loadEmployee(id: string) {
        this.loading.set(true);

        this.staffService.getById(id).subscribe({
            next: (emp) => {
                this.employee.set(emp);
                this.loading.set(false);
                this.loadRelatedData(id);
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el empleado' });
                this.loading.set(false);
            }
        });
    }

    loadRelatedData(id: string) {
        this.staffService.getPayrollConfig(id).subscribe({
            next: (config) => this.payrollConfig.set(config),
            error: () => { } // Config might not exist yet
        });

        this.staffService.getDocuments(id).subscribe({
            next: (docs) => this.documents.set(docs)
        });

        this.staffService.getHistory(id).subscribe({
            next: (hist) => this.history.set(hist)
        });

        this.staffService.getLeaveBalance(id).subscribe({
            next: (balance) => this.leaveBalance.set(balance)
        });

        this.leaveService.getByEmployee(id).subscribe({
            next: (page) => this.leaveRequests.set(page.content)
        });
    }

    calculateTenure(): string {
        if (!this.employee()?.hireDate) return '0 meses';
        const hire = new Date(this.employee()!.hireDate);
        const now = new Date();
        const months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
        if (months >= 12) {
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            return `${years} año${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}` : ''}`;
        }
        return `${months} mes${months !== 1 ? 'es' : ''}`;
    }

    getVacationPercentage(): number {
        if (!this.leaveBalance()) return 0;
        const { daysRemaining, daysEntitled } = this.leaveBalance()!;
        return Math.round((daysRemaining / daysEntitled) * 100);
    }

    formatMoney(amount: number): string {
        if (!amount) return '$0';
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    }

    formatDate(date: string | undefined): string {
        if (!date) return '';
        return new Date(date).toLocaleDateString('es-CL');
    }

    formatDateTime(date: string): string {
        if (!date) return '';
        return new Date(date).toLocaleString('es-CL');
    }

    getCountryName(code: string): string {
        const countries: Record<string, string> = {
            CL: '🇨🇱 Chile',
            AR: '🇦🇷 Argentina',
            PE: '🇵🇪 Perú',
            CO: '🇨🇴 Colombia',
            VE: '🇻🇪 Venezuela',
            ES: '🇪🇸 España'
        };
        return countries[code] || code;
    }

    getDocumentIcon(mimeType: string | undefined): string {
        if (!mimeType) return 'pi pi-file';
        if (mimeType.includes('pdf')) return 'pi pi-file-pdf';
        if (mimeType.includes('image')) return 'pi pi-image';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'pi pi-file-word';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'pi pi-file-excel';
        return 'pi pi-file';
    }

    getEventTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            HIRED: 'Contratación',
            TERMINATED: 'Desvinculación',
            PROMOTED: 'Promoción',
            SALARY_CHANGE: 'Cambio de Sueldo',
            POSITION_CHANGE: 'Cambio de Cargo',
            LEAVE_APPROVED: 'Vacaciones Aprobadas',
            DOCUMENT_ADDED: 'Documento Agregado',
            OTHER: 'Otro'
        };
        return labels[type] || type;
    }
}
