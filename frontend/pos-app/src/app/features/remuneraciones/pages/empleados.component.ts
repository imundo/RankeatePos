import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PayrollService, Employee } from '../services/payroll.service';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/remuneraciones" class="back-link">← Volver</a>
        <h1>👥 Empleados</h1>
        <button class="btn btn-primary" (click)="openModal()">➕ Nuevo Empleado</button>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando empleados...</p>
        </div>
      } @else {
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">{{ activeCount() }}</span>
            <span class="stat-label">Activos</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ totalPayroll() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            <span class="stat-label">Nómina Total</span>
          </div>
        </div>

        <div class="employees-table">
          <div class="table-header">
            <span>RUT</span>
            <span>Nombre</span>
            <span>Cargo</span>
            <span>Departamento</span>
            <span>Sueldo Base</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          <div class="table-body">
            @for (emp of employees(); track emp.id) {
              <div class="table-row">
                <span>{{ emp.rut }}</span>
                <span class="emp-name">{{ emp.firstName }} {{ emp.lastName }}</span>
                <span>{{ emp.position || '-' }}</span>
                <span>{{ emp.department || '-' }}</span>
                <span class="salary">{{ emp.baseSalary | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                <span><span class="status-badge" [class.active]="emp.isActive">{{ emp.isActive ? 'Activo' : 'Inactivo' }}</span></span>
                <span class="actions">
                  <button class="action-btn" title="Editar" (click)="editEmployee(emp)">✏️</button>
                  <button class="action-btn" title="Ver" (click)="viewEmployee(emp)">👁️</button>
                </span>
              </div>
            } @empty {
              <div class="empty-state">
                <p>No hay empleados registrados</p>
                <button class="btn btn-primary" (click)="openModal()">Agregar Primer Empleado</button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingEmployee() ? 'Editar' : 'Nuevo' }} Empleado</h2>
              <button class="close-btn" (click)="closeModal()">✕</button>
            </div>
            <form (ngSubmit)="saveEmployee()" class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label>RUT *</label>
                  <input type="text" [(ngModel)]="form.rut" name="rut" placeholder="12.345.678-9" required>
                </div>
                <div class="form-group">
                  <label>Tipo Contrato</label>
                  <select [(ngModel)]="form.contractType" name="contractType">
                    <option value="INDEFINIDO">Indefinido</option>
                    <option value="PLAZO_FIJO">Plazo Fijo</option>
                    <option value="POR_OBRA">Por Obra</option>
                    <option value="HONORARIOS">Honorarios</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre *</label>
                  <input type="text" [(ngModel)]="form.firstName" name="firstName" required>
                </div>
                <div class="form-group">
                  <label>Apellido *</label>
                  <input type="text" [(ngModel)]="form.lastName" name="lastName" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [(ngModel)]="form.email" name="email">
                </div>
                <div class="form-group">
                  <label>Teléfono</label>
                  <input type="tel" [(ngModel)]="form.phone" name="phone">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Cargo</label>
                  <input type="text" [(ngModel)]="form.position" name="position">
                </div>
                <div class="form-group">
                  <label>Departamento</label>
                  <input type="text" [(ngModel)]="form.department" name="department">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Sueldo Base *</label>
                  <input type="number" [(ngModel)]="form.baseSalary" name="baseSalary" required>
                </div>
                <div class="form-group">
                  <label>Fecha Ingreso *</label>
                  <input type="date" [(ngModel)]="form.hireDate" name="hireDate" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>AFP</label>
                  <select [(ngModel)]="form.afpCode" name="afpCode">
                    <option value="">Seleccionar...</option>
                    <option value="CAPITAL">AFP Capital</option>
                    <option value="CUPRUM">AFP Cuprum</option>
                    <option value="HABITAT">AFP Habitat</option>
                    <option value="MODELO">AFP Modelo</option>
                    <option value="PLANVITAL">AFP Planvital</option>
                    <option value="PROVIDA">AFP Provida</option>
                    <option value="UNO">AFP Uno</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Salud</label>
                  <select [(ngModel)]="form.healthInsuranceCode" name="healthInsuranceCode">
                    <option value="">Seleccionar...</option>
                    <option value="FONASA">Fonasa</option>
                    <option value="BANMEDICA">Banmédica</option>
                    <option value="COLMENA">Colmena</option>
                    <option value="CONSALUD">Consalud</option>
                    <option value="CRUZBLANCA">Cruz Blanca</option>
                    <option value="VIDATRES">Vida Tres</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; }
    .back-link:hover { color: #fff; }
    h1 { color: #fff; margin: 0; flex: 1; }
    .btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }

    .stats-row { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px 24px; display: flex; flex-direction: column; gap: 4px; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #4ade80; }
    .stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; }

    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: rgba(255,255,255,0.6); }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .employees-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 110px 1.5fr 1fr 1fr 120px 80px 100px; gap: 12px; padding: 14px 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .table-body { max-height: 60vh; overflow-y: auto; }
    .table-row { display: grid; grid-template-columns: 110px 1.5fr 1fr 1fr 120px 80px 100px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; align-items: center; transition: background 0.2s; }
    .table-row:hover { background: rgba(255,255,255,0.03); }
    .emp-name { font-weight: 500; }
    .salary { color: #4ade80; font-weight: 600; }
    .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: rgba(156,163,175,0.2); color: #9ca3af; }
    .status-badge.active { background: rgba(74,222,128,0.2); color: #4ade80; }
    .actions { display: flex; gap: 8px; }
    .action-btn { background: rgba(255,255,255,0.05); border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
    .action-btn:hover { background: rgba(255,255,255,0.15); }

    .empty-state { padding: 60px; text-align: center; color: rgba(255,255,255,0.5); }
    .empty-state p { margin-bottom: 16px; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
    .modal-content { background: #1a1a3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .modal-header h2 { margin: 0; color: #fff; font-size: 1.25rem; }
    .close-btn { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 1.5rem; cursor: pointer; }
    .modal-body { padding: 24px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.85rem; color: rgba(255,255,255,0.7); }
    .form-group input, .form-group select { padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 0.95rem; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #667eea; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 8px; }
  `]
})
export class EmpleadosComponent implements OnInit {
  employees = signal<Employee[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editingEmployee = signal<Employee | null>(null);

  form: Partial<Employee> = this.getEmptyForm();

  activeCount = computed(() => this.employees().filter(e => e.isActive).length);
  totalPayroll = computed(() => this.employees().filter(e => e.isActive).reduce((sum, e) => sum + e.baseSalary, 0));

  constructor(private payrollService: PayrollService) { }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.payrollService.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading employees:', err);
        this.loading.set(false);
      }
    });
  }

  openModal(): void {
    this.editingEmployee.set(null);
    this.form = this.getEmptyForm();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingEmployee.set(null);
  }

  editEmployee(emp: Employee): void {
    this.editingEmployee.set(emp);
    this.form = { ...emp };
    this.showModal.set(true);
  }

  viewEmployee(emp: Employee): void {
    // Could open a detail view or just show edit modal in read-only mode
    this.editEmployee(emp);
  }

  saveEmployee(): void {
    this.saving.set(true);
    this.payrollService.createEmployee(this.form).subscribe({
      next: (created) => {
        this.employees.update(list => [...list, created]);
        this.closeModal();
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error saving employee:', err);
        this.saving.set(false);
      }
    });
  }

  private getEmptyForm(): Partial<Employee> {
    return {
      rut: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      baseSalary: 0,
      hireDate: new Date().toISOString().split('T')[0],
      contractType: 'INDEFINIDO',
      afpCode: '',
      healthInsuranceCode: '',
      isActive: true
    };
  }
}
