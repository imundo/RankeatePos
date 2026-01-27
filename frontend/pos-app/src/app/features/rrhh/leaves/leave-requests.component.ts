import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TabViewModule } from 'primeng/tabview';
import { AvatarModule } from 'primeng/avatar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LeaveService, LeaveRequest, CreateLeaveRequest, LeaveRequestType } from '@app/core/services/leave.service';
import { StaffService, Employee } from '@app/core/services/staff.service';

@Component({
    selector: 'app-leave-requests',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        DropdownModule,
        CalendarModule,
        InputTextareaModule,
        TabViewModule,
        AvatarModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="leave-container fade-in">
      <div class="page-header">
        <div class="header-content">
          <h1>📋 Solicitudes de Permisos</h1>
          <p class="subtitle">Gestiona vacaciones, permisos y beneficios</p>
        </div>
        <button pButton label="Nueva Solicitud" icon="pi pi-plus" class="p-button-rounded p-button-success" 
                (click)="openCreateModal()"></button>
      </div>

      <!-- Pending Badge -->
      <div class="pending-alert glass-card" *ngIf="pendingCount() > 0">
        <i class="pi pi-bell" style="color: #F59E0B;"></i>
        <span>Tienes <strong>{{ pendingCount() }}</strong> solicitudes pendientes de aprobación</span>
        <button pButton label="Ver Pendientes" class="p-button-warning p-button-sm" (click)="activeTab = 1"></button>
      </div>

      <!-- Tabs -->
      <p-tabView [(activeIndex)]="activeTab">
        <p-tabPanel header="Todas las Solicitudes">
          <p-table [value]="allRequests()" [paginator]="true" [rows]="10" [loading]="loading()"
                   styleClass="p-datatable-striped" [globalFilterFields]="['employeeName', 'type', 'status']">
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 200px">Empleado</th>
                <th>Tipo</th>
                <th>Fechas</th>
                <th>Días</th>
                <th>Estado</th>
                <th>Fecha Solicitud</th>
                <th style="width: 120px">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-request>
              <tr>
                <td>
                  <div class="employee-cell">
                    <p-avatar [label]="getInitials(request.employeeName)" shape="circle"></p-avatar>
                    <span>{{ request.employeeName }}</span>
                  </div>
                </td>
                <td>
                  <span class="type-badge" [attr.data-type]="request.type">
                    {{ getTypeIcon(request.type) }} {{ leaveService.getTypeLabel(request.type) }}
                  </span>
                </td>
                <td>
                  <span *ngIf="request.startDate">
                    {{ formatDate(request.startDate) }} 
                    <span *ngIf="request.endDate && request.endDate !== request.startDate">
                      - {{ formatDate(request.endDate) }}
                    </span>
                  </span>
                  <span *ngIf="!request.startDate">-</span>
                </td>
                <td>{{ request.daysRequested || '-' }}</td>
                <td>
                  <p-tag [value]="leaveService.getStatusLabel(request.status)" 
                         [severity]="leaveService.getStatusSeverity(request.status)"></p-tag>
                </td>
                <td>{{ formatDate(request.createdAt) }}</td>
                <td>
                  <div class="action-buttons" *ngIf="request.status === 'PENDING'">
                    <button pButton icon="pi pi-check" class="p-button-success p-button-text p-button-sm"
                            pTooltip="Aprobar" (click)="approveRequest(request)"></button>
                    <button pButton icon="pi pi-times" class="p-button-danger p-button-text p-button-sm"
                            pTooltip="Rechazar" (click)="rejectRequest(request)"></button>
                  </div>
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" *ngIf="request.status !== 'PENDING'"
                          pTooltip="Ver detalle" (click)="viewDetails(request)"></button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="7" class="text-center py-4">
                  <i class="pi pi-inbox" style="font-size: 2rem; color: var(--text-secondary-color);"></i>
                  <p>No hay solicitudes registradas</p>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <p-tabPanel [header]="'Pendientes (' + pendingCount() + ')'">
          <div class="pending-grid">
            @for (request of pendingRequests(); track request.id) {
              <div class="pending-card glass-card">
                <div class="card-header">
                  <p-avatar [label]="getInitials(request.employeeName)" shape="circle" size="large"></p-avatar>
                  <div class="header-info">
                    <h3>{{ request.employeeName }}</h3>
                    <span class="type-badge">{{ getTypeIcon(request.type) }} {{ leaveService.getTypeLabel(request.type) }}</span>
                  </div>
                  <span class="request-date">{{ formatDate(request.createdAt) }}</span>
                </div>
                
                <div class="card-body">
                  <div class="detail-row" *ngIf="request.startDate">
                    <i class="pi pi-calendar"></i>
                    <span>{{ formatDate(request.startDate) }} - {{ formatDate(request.endDate) }}</span>
                  </div>
                  <div class="detail-row" *ngIf="request.daysRequested">
                    <i class="pi pi-clock"></i>
                    <span>{{ request.daysRequested }} días</span>
                  </div>
                  <div class="detail-row" *ngIf="request.amountRequested">
                    <i class="pi pi-dollar"></i>
                    <span>{{ formatMoney(request.amountRequested) }}</span>
                  </div>
                  <div class="reason" *ngIf="request.reason">
                    <strong>Motivo:</strong> {{ request.reason }}
                  </div>
                </div>

                <div class="card-actions">
                  <button pButton label="Rechazar" icon="pi pi-times" class="p-button-outlined p-button-danger"
                          (click)="rejectRequest(request)"></button>
                  <button pButton label="Aprobar" icon="pi pi-check" class="p-button-success"
                          (click)="approveRequest(request)"></button>
                </div>
              </div>
            }
          </div>

          <div class="empty-state" *ngIf="pendingRequests().length === 0">
            <i class="pi pi-check-circle" style="font-size: 4rem; color: #10B981;"></i>
            <h3>¡Todo al día!</h3>
            <p>No hay solicitudes pendientes de aprobación</p>
          </div>
        </p-tabPanel>
      </p-tabView>

      <!-- Create Modal -->
      <p-dialog [(visible)]="showModal" header="Nueva Solicitud" [modal]="true" [style]="{width: '500px'}">
        <div class="form-grid">
          <div class="field">
            <label>Empleado *</label>
            <p-dropdown [options]="employees()" [(ngModel)]="formData.employeeId" 
                        optionLabel="fullName" optionValue="id" placeholder="Seleccionar empleado"
                        [filter]="true" filterBy="fullName" class="w-full"></p-dropdown>
          </div>

          <div class="field">
            <label>Tipo de Solicitud *</label>
            <p-dropdown [options]="requestTypes" [(ngModel)]="formData.type" 
                        optionLabel="label" optionValue="value" placeholder="Seleccionar tipo"
                        class="w-full" (onChange)="onTypeChange()"></p-dropdown>
          </div>

          <div class="form-row" *ngIf="showDateFields()">
            <div class="field">
              <label>Fecha Inicio</label>
              <p-calendar [(ngModel)]="formData.startDate" dateFormat="dd/mm/yy" [showIcon]="true" class="w-full"></p-calendar>
            </div>
            <div class="field">
              <label>Fecha Fin</label>
              <p-calendar [(ngModel)]="formData.endDate" dateFormat="dd/mm/yy" [showIcon]="true" class="w-full"></p-calendar>
            </div>
          </div>

          <div class="field" *ngIf="formData.type === 'SALARY_ADVANCE'">
            <label>Monto Solicitado</label>
            <p-inputNumber [(ngModel)]="formData.amountRequested" mode="currency" currency="CLP" locale="es-CL" class="w-full"></p-inputNumber>
          </div>

          <div class="field">
            <label>Motivo / Observaciones</label>
            <textarea pInputTextarea [(ngModel)]="formData.reason" rows="3" class="w-full" 
                      placeholder="Describe el motivo de la solicitud..."></textarea>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancelar" class="p-button-text" (click)="showModal = false"></button>
          <button pButton label="Enviar Solicitud" class="p-button-primary" (click)="createRequest()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <!-- Reject Dialog -->
      <p-dialog [(visible)]="showRejectModal" header="Rechazar Solicitud" [modal]="true" [style]="{width: '400px'}">
        <div class="field">
          <label>Motivo del Rechazo *</label>
          <textarea pInputTextarea [(ngModel)]="rejectReason" rows="3" class="w-full" 
                    placeholder="Indica el motivo del rechazo..."></textarea>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancelar" class="p-button-text" (click)="showRejectModal = false"></button>
          <button pButton label="Confirmar Rechazo" class="p-button-danger" (click)="confirmReject()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
    styles: [`
    .leave-container {
      padding: 2rem;
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
      background: linear-gradient(90deg, #6366F1, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: var(--text-secondary-color);
      margin: 0.5rem 0 0;
    }

    .pending-alert {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      margin-bottom: 2rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
    }

    .employee-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .type-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 0.85rem;
      background: rgba(99, 102, 241, 0.1);
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .pending-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .pending-card {
      padding: 1.5rem;

      .card-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .header-info {
        flex: 1;
        h3 { margin: 0 0 0.5rem; }
      }

      .request-date {
        font-size: 0.8rem;
        color: var(--text-secondary-color);
      }

      .card-body {
        margin-bottom: 1.5rem;
      }

      .detail-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
        color: var(--text-secondary-color);
        i { color: #6366F1; width: 20px; }
      }

      .reason {
        margin-top: 1rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        font-size: 0.9rem;
      }

      .card-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label { font-weight: 500; }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-secondary-color);
    }
  `]
})
export class LeaveRequestsComponent implements OnInit {
    leaveService = inject(LeaveService);
    private staffService = inject(StaffService);
    private messageService = inject(MessageService);
    private confirmService = inject(ConfirmationService);

    allRequests = signal<LeaveRequest[]>([]);
    pendingRequests = signal<LeaveRequest[]>([]);
    employees = signal<Employee[]>([]);
    loading = signal(true);
    saving = signal(false);
    pendingCount = signal(0);
    activeTab = 0;

    showModal = false;
    showRejectModal = false;
    rejectReason = '';
    rejectingRequest: LeaveRequest | null = null;

    formData: CreateLeaveRequest = this.getEmptyForm();

    requestTypes = [
        { label: '🏖️ Vacaciones', value: 'VACATION' },
        { label: '📋 Permiso sin goce', value: 'LEAVE_WITHOUT_PAY' },
        { label: '🏥 Licencia médica', value: 'MEDICAL_LEAVE' },
        { label: '💰 Anticipo de sueldo', value: 'SALARY_ADVANCE' },
        { label: '📅 Día administrativo', value: 'ADMINISTRATIVE_DAY' },
        { label: '⏰ Compensatorio', value: 'COMPENSATORY' }
    ];

    ngOnInit() {
        this.loadRequests();
        this.loadEmployees();
    }

    loadRequests() {
        this.loading.set(true);

        this.leaveService.getAll(0, 100).subscribe({
            next: (page) => {
                this.allRequests.set(page.content);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las solicitudes' });
                this.loading.set(false);
            }
        });

        this.leaveService.getPending().subscribe({
            next: (pending) => {
                this.pendingRequests.set(pending);
                this.pendingCount.set(pending.length);
            }
        });
    }

    loadEmployees() {
        this.staffService.getAllActive().subscribe({
            next: (employees) => this.employees.set(employees)
        });
    }

    openCreateModal() {
        this.formData = this.getEmptyForm();
        this.showModal = true;
    }

    onTypeChange() {
        // Reset date fields when changing type
    }

    showDateFields(): boolean {
        const typesWithDates: LeaveRequestType[] = ['VACATION', 'LEAVE_WITHOUT_PAY', 'MEDICAL_LEAVE', 'ADMINISTRATIVE_DAY', 'COMPENSATORY'];
        return typesWithDates.includes(this.formData.type);
    }

    createRequest() {
        if (!this.formData.employeeId || !this.formData.type) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Complete los campos requeridos' });
            return;
        }

        this.saving.set(true);
        this.leaveService.create(this.formData).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Solicitud creada correctamente' });
                this.showModal = false;
                this.saving.set(false);
                this.loadRequests();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear solicitud' });
                this.saving.set(false);
            }
        });
    }

    approveRequest(request: LeaveRequest) {
        this.confirmService.confirm({
            message: `¿Aprobar la solicitud de ${request.employeeName}?`,
            header: 'Confirmar Aprobación',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.leaveService.approve(request.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Aprobada', detail: 'Solicitud aprobada correctamente' });
                        this.loadRequests();
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al aprobar' });
                    }
                });
            }
        });
    }

    rejectRequest(request: LeaveRequest) {
        this.rejectingRequest = request;
        this.rejectReason = '';
        this.showRejectModal = true;
    }

    confirmReject() {
        if (!this.rejectReason || !this.rejectingRequest) {
            this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Ingresa un motivo de rechazo' });
            return;
        }

        this.leaveService.reject(this.rejectingRequest.id, this.rejectReason).subscribe({
            next: () => {
                this.messageService.add({ severity: 'info', summary: 'Rechazada', detail: 'Solicitud rechazada' });
                this.showRejectModal = false;
                this.rejectingRequest = null;
                this.loadRequests();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al rechazar' });
            }
        });
    }

    viewDetails(request: LeaveRequest) {
        // TODO: Open detail modal
    }

    getTypeIcon(type: LeaveRequestType): string {
        const icons: Record<LeaveRequestType, string> = {
            VACATION: '🏖️',
            LEAVE_WITHOUT_PAY: '📋',
            MEDICAL_LEAVE: '🏥',
            SALARY_ADVANCE: '💰',
            ADMINISTRATIVE_DAY: '📅',
            COMPENSATORY: '⏰',
            BENEFIT: '🎁'
        };
        return icons[type] || '📋';
    }

    getInitials(name: string): string {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    formatDate(date: string | undefined): string {
        if (!date) return '';
        return new Date(date).toLocaleDateString('es-CL');
    }

    formatMoney(amount: number): string {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    }

    private getEmptyForm(): CreateLeaveRequest {
        return {
            employeeId: '',
            type: 'VACATION'
        };
    }
}
