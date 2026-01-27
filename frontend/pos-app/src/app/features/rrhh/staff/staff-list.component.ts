import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService, ConfirmationService } from 'primeng/api';
import { RouterLink } from '@angular/router';
import { StaffService, Employee, CreateEmployeeRequest } from '@app/core/services/staff.service';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    AvatarModule,
    TagModule,
    CardModule,
    FormsModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    RouterLink
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="staff-container fade-in">
      <div class="page-header">
        <div class="header-content">
          <h1>📇 Gestión de Personal</h1>
          <p class="subtitle">Administra tu equipo de trabajo y permisos</p>
        </div>
        <div class="header-actions">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input pInputText placeholder="Buscar empleado..." [(ngModel)]="searchQuery" (input)="onSearch()" />
          </span>
          <button pButton label="Nuevo Empleado" icon="pi pi-plus" class="p-button-rounded p-button-success" (click)="openCreateModal()"></button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid" *ngIf="stats()">
        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #6366F1, #8B5CF6);">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.activeEmployees }}</span>
            <span class="stat-label">Empleados Activos</span>
          </div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #10B981, #34D399);">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.pendingLeaveRequests }}</span>
            <span class="stat-label">Solicitudes Pendientes</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-container" *ngIf="loading()">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
        <p>Cargando empleados...</p>
      </div>

      <!-- Employee Cards Grid -->
      <div class="employee-grid" *ngIf="!loading()">
        @for (emp of employees(); track emp.id) {
          <div class="employee-card glass-card" [class.inactive]="!emp.active">
            <div class="card-header">
              <p-avatar [label]="emp.initials" shape="circle" size="large" [style]="{'background': getAvatarColor(emp.id)}"></p-avatar>
              <div class="header-info">
                <h3>{{ emp.firstName }} {{ emp.lastName }}</h3>
                <span class="position-badge">{{ emp.position }}</span>
              </div>
              <div class="card-actions">
                <button pButton icon="pi pi-pencil" class="p-button-text p-button-rounded p-button-sm" 
                        pTooltip="Editar" (click)="editEmployee(emp)"></button>
                <button pButton icon="pi pi-eye" class="p-button-text p-button-rounded p-button-sm" 
                        pTooltip="Ver detalle" [routerLink]="['/rrhh/staff', emp.id]"></button>
              </div>
            </div>
            
            <div class="card-body">
              <div class="info-row">
                <i class="pi pi-id-card"></i>
                <span>{{ emp.rut }}</span>
              </div>
              <div class="info-row" *ngIf="emp.email">
                <i class="pi pi-envelope"></i>
                <span>{{ emp.email }}</span>
              </div>
              <div class="info-row">
                <i class="pi pi-key"></i>
                <span class="pin-code">PIN: {{ emp.pinCode }}</span>
                <button pButton icon="pi pi-refresh" class="p-button-text p-button-rounded p-button-xs" 
                        pTooltip="Regenerar PIN" (click)="regeneratePin(emp)"></button>
              </div>
              <div class="info-row">
                <i class="pi pi-calendar"></i>
                <span>Desde {{ formatDate(emp.hireDate) }}</span>
              </div>
              <div class="info-row" *ngIf="emp.vacationDaysRemaining > 0">
                <i class="pi pi-sun"></i>
                <span>{{ emp.vacationDaysRemaining }} días de vacaciones</span>
              </div>
            </div>

            <div class="card-footer">
              <p-tag [value]="emp.active ? 'Activo' : 'Inactivo'" [severity]="emp.active ? 'success' : 'danger'"></p-tag>
              <span class="salary">{{ formatMoney(emp.baseSalary) }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading() && employees().length === 0">
        <i class="pi pi-users" style="font-size: 4rem; color: var(--text-secondary-color);"></i>
        <h3>No hay empleados registrados</h3>
        <p>Comienza agregando tu primer empleado</p>
        <button pButton label="Agregar Empleado" icon="pi pi-plus" (click)="openCreateModal()"></button>
      </div>

      <!-- Create/Edit Modal -->
      <p-dialog [(visible)]="showModal" [header]="isEditing ? 'Editar Empleado' : 'Nuevo Empleado'" 
                [modal]="true" [style]="{width: '550px'}" styleClass="glass-dialog">
        <div class="form-grid">
          <div class="form-row">
            <div class="field">
              <label>Nombre *</label>
              <input pInputText placeholder="Ej: Juan" [(ngModel)]="formData.firstName" class="w-full" />
            </div>
            <div class="field">
              <label>Apellido *</label>
              <input pInputText placeholder="Ej: Pérez" [(ngModel)]="formData.lastName" class="w-full" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="field">
              <label>RUT *</label>
              <input pInputText placeholder="12.345.678-9" [(ngModel)]="formData.rut" class="w-full" [disabled]="isEditing" />
            </div>
            <div class="field">
              <label>Cargo *</label>
              <input pInputText placeholder="Ej: Cajero" [(ngModel)]="formData.position" class="w-full" />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>Email</label>
              <input pInputText type="email" placeholder="juan@empresa.cl" [(ngModel)]="formData.email" class="w-full" />
            </div>
            <div class="field">
              <label>Teléfono</label>
              <input pInputText placeholder="+56 9 1234 5678" [(ngModel)]="formData.phone" class="w-full" />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>Fecha de Ingreso *</label>
              <p-calendar [(ngModel)]="formData.hireDate" dateFormat="dd/mm/yy" [showIcon]="true" class="w-full"></p-calendar>
            </div>
            <div class="field">
              <label>Sueldo Base</label>
              <p-inputNumber [(ngModel)]="formData.baseSalary" mode="currency" currency="CLP" locale="es-CL" class="w-full"></p-inputNumber>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>País</label>
              <p-dropdown [options]="countries" [(ngModel)]="formData.countryCode" optionLabel="name" optionValue="code" class="w-full"></p-dropdown>
            </div>
          </div>
        </div>
        
        <ng-template pTemplate="footer">
          <button pButton label="Cancelar" class="p-button-text" (click)="showModal = false"></button>
          <button pButton [label]="isEditing ? 'Guardar Cambios' : 'Crear Empleado'" 
                  class="p-button-primary" (click)="saveEmployee()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .staff-container {
      padding: 2rem;
      background: radial-gradient(circle at top left, rgba(99, 102, 241, 0.15), transparent 40%),
                  radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.1), transparent 40%);
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
      gap: 1.5rem;
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
      text-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .subtitle {
      color: #94A3B8;
      margin: 0.5rem 0 0;
      font-size: 1.1rem;
      font-weight: 400;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      padding: 0.5rem;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
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
      
      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
        z-index: 0;
        pointer-events: none;
      }
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
      z-index: 1;
      i { font-size: 1.75rem; color: white; }
    }

    .stat-info {
      z-index: 1;
    }

    .stat-value {
      font-size: 2.25rem;
      font-weight: 800;
      display: block;
      line-height: 1.2;
      background: linear-gradient(180deg, #fff, #e2e8f0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #94A3B8;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .glass-card {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 1.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      
      &:hover {
        transform: translateY(-5px) scale(1.01);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
        border-color: rgba(99, 102, 241, 0.4);
        background: rgba(30, 41, 59, 0.6);
      }

      &.inactive {
        opacity: 0.7;
        filter: grayscale(0.8);
      }
    }

    .employee-card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .header-info {
      flex: 1;
      h3 {
        margin: 0 0 0.35rem 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: white;
      }
    }

    .position-badge {
      font-size: 0.8rem;
      color: #bfdbfe;
      background: rgba(59, 130, 246, 0.15);
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
      color: #cbd5e1;
      font-size: 0.95rem;
      
      i { 
        color: #818cf8; 
        font-size: 1.1rem;
        width: 20px;
        text-align: center;
      }
      
      .pin-code {
        font-family: 'JetBrains Mono', monospace;
        background: rgba(99, 102, 241, 0.1);
        color: #a5b4fc;
        padding: 4px 8px;
        border-radius: 6px;
        font-weight: 600;
        letter-spacing: 1px;
      }
    }

    .card-footer {
      margin-top: auto;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .salary {
      font-weight: 700;
      font-size: 1.2rem;
      color: #34d399;
      text-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
    }

    .loading-container, .empty-state {
      text-align: center;
      padding: 6rem 2rem;
      color: #94a3b8;
      
      i { margin-bottom: 1.5rem; color: #475569; }
      h3 { font-size: 1.5rem; color: white; margin-bottom: 0.5rem; }
    }

  `]
})
export class StaffListComponent implements OnInit {
  private staffService = inject(StaffService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmationService);

  employees = signal<Employee[]>([]);
  stats = signal<{ totalEmployees: number; activeEmployees: number; pendingLeaveRequests: number } | null>(null);
  loading = signal(true);
  saving = signal(false);

  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  searchQuery = '';

  formData: CreateEmployeeRequest = this.getEmptyForm();

  countries = [
    { name: '🇨🇱 Chile', code: 'CL' },
    { name: '🇦🇷 Argentina', code: 'AR' },
    { name: '🇵🇪 Perú', code: 'PE' },
    { name: '🇨🇴 Colombia', code: 'CO' },
    { name: '🇻🇪 Venezuela', code: 'VE' },
    { name: '🇪🇸 España', code: 'ES' }
  ];

  ngOnInit() {
    this.loadEmployees();
    this.loadStats();
  }

  loadEmployees() {
    this.loading.set(true);
    this.staffService.getAllActive().subscribe({
      next: (employees) => {
        this.employees.set(employees);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading employees', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los empleados' });
        this.loading.set(false);
      }
    });
  }

  loadStats() {
    this.staffService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: (err) => console.error('Error loading stats', err)
    });
  }

  onSearch() {
    // Debounced search would be better, but for simplicity:
    if (this.searchQuery.length >= 2) {
      this.staffService.getAll(0, 50, this.searchQuery).subscribe({
        next: (page) => this.employees.set(page.content)
      });
    } else if (this.searchQuery.length === 0) {
      this.loadEmployees();
    }
  }

  openCreateModal() {
    this.isEditing = false;
    this.editingId = null;
    this.formData = this.getEmptyForm();
    this.showModal = true;
  }

  editEmployee(emp: Employee) {
    this.isEditing = true;
    this.editingId = emp.id;
    this.formData = {
      firstName: emp.firstName,
      lastName: emp.lastName,
      rut: emp.rut,
      email: emp.email,
      phone: emp.phone,
      position: emp.position,
      hireDate: emp.hireDate,
      baseSalary: emp.baseSalary,
      countryCode: emp.countryCode
    };
    this.showModal = true;
  }

  saveEmployee() {
    if (!this.formData.firstName || !this.formData.lastName || !this.formData.rut || !this.formData.position) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Complete los campos requeridos' });
      return;
    }

    this.saving.set(true);

    if (this.isEditing && this.editingId) {
      this.staffService.update(this.editingId, this.formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Empleado actualizado' });
          this.showModal = false;
          this.saving.set(false);
          this.loadEmployees();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar' });
          this.saving.set(false);
        }
      });
    } else {
      this.staffService.create(this.formData).subscribe({
        next: (emp) => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Empleado creado. PIN: ${emp.pinCode}` });
          this.showModal = false;
          this.saving.set(false);
          this.loadEmployees();
          this.loadStats();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear' });
          this.saving.set(false);
        }
      });
    }
  }

  regeneratePin(emp: Employee) {
    this.confirmService.confirm({
      message: `¿Regenerar el PIN de ${emp.fullName}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.staffService.regeneratePin(emp.id).subscribe({
          next: (updated) => {
            this.messageService.add({ severity: 'success', summary: 'PIN Regenerado', detail: `Nuevo PIN: ${updated.pinCode}` });
            this.loadEmployees();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo regenerar el PIN' });
          }
        });
      }
    });
  }

  formatMoney(amount: number) {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
  }

  formatDate(date: string) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-CL');
  }

  getAvatarColor(id: string): string {
    const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  }

  private getEmptyForm(): CreateEmployeeRequest {
    return {
      firstName: '',
      lastName: '',
      rut: '',
      position: '',
      hireDate: new Date().toISOString().split('T')[0],
      countryCode: 'CL'
    };
  }
}
