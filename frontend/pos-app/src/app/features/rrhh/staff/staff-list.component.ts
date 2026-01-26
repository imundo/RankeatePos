import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';

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
        FormsModule
    ],
    template: `
    <div class="staff-container fade-in">
      <div class="page-header">
        <div class="header-content">
          <h1>📇 Gestión de Personal</h1>
          <p class="subtitle">Administra tu equipo de trabajo y permisos</p>
        </div>
        <button pButton label="Nuevo Empleado" icon="pi pi-plus" class="p-button-rounded p-button-success" (click)="showCreateModal = true"></button>
      </div>

      <!-- Employee Cards Grid -->
      <div class="employee-grid">
        @for (emp of employees(); track emp.rut) {
          <div class="employee-card glass-card">
            <div class="card-header">
              <p-avatar [label]="emp.initials" shape="circle" size="large" [styleClass]="'avatar-' + emp.color"></p-avatar>
              <div class="header-info">
                <h3>{{ emp.firstName }} {{ emp.lastName }}</h3>
                <span class="position-badge">{{ emp.position }}</span>
              </div>
              <button pButton icon="pi pi-ellipsis-v" class="p-button-text p-button-rounded p-button-secondary"></button>
            </div>
            
            <div class="card-body">
              <div class="info-row">
                <i class="pi pi-id-card"></i>
                <span>{{ emp.rut }}</span>
              </div>
              <div class="info-row">
                <i class="pi pi-envelope"></i>
                <span>{{ emp.email }}</span>
              </div>
              <div class="info-row">
                <i class="pi pi-calendar"></i>
                <span>Desde {{ emp.hireDate }}</span>
              </div>
            </div>

            <div class="card-footer">
              <p-tag [value]="emp.active ? 'Activo' : 'Inactivo'" [severity]="emp.active ? 'success' : 'danger'"></p-tag>
              <span class="salary">{{ formatMoney(emp.baseSalary) }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Create Modal (Simplified) -->
      <p-dialog [(visible)]="showCreateModal" header="Nuevo Colaborador" [modal]="true" [style]="{width: '400px'}" styleClass="glass-dialog">
        <div class="form-grid">
          <div class="field">
            <label>Nombre</label>
            <input pInputText placeholder="Ej: Juan" class="w-full" />
          </div>
          <div class="field">
            <label>Apellido</label>
            <input pInputText placeholder="Ej: Pérez" class="w-full" />
          </div>
          <div class="field">
            <label>RUT</label>
            <input pInputText placeholder="12.345.678-9" class="w-full" />
          </div>
          <div class="field">
            <label>Cargo</label>
            <input pInputText placeholder="Ej: Cajero" class="w-full" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancelar" class="p-button-text" (click)="showCreateModal = false"></button>
          <button pButton label="Guardar" class="p-button-primary" (click)="showCreateModal = false"></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
    styles: [`
    .staff-container {
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
      background: linear-gradient(90deg, #6366F1, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: var(--text-secondary-color);
      margin: 0.5rem 0 0;
    }

    .employee-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        border-color: rgba(99, 102, 241, 0.3);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .header-info h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    .position-badge {
      font-size: 0.85rem;
      color: #94A3B8;
      background: rgba(148, 163, 184, 0.1);
      padding: 2px 8px;
      border-radius: 12px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      color: var(--text-secondary-color);
      font-size: 0.9rem;
      
      i { color: #6366F1; }
    }

    .card-footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .salary {
      font-weight: 600;
      font-size: 1.1rem;
      color: #10B981;
    }
  `]
})
export class StaffListComponent implements OnInit {
    employees = signal<any[]>([]); // Using signal for reactivity
    showCreateModal = false;

    ngOnInit() {
        // Mock Data for now - will be replaced by API call
        this.employees.set([
            { firstName: 'Juan', lastName: 'Pérez', initials: 'JP', color: 'blue', rut: '12.345.678-9', email: 'juan@eltrigal.cl', position: 'Panadero Jefe', active: true, baseSalary: 850000, hireDate: '15/01/2023' },
            { firstName: 'Maria', lastName: 'Soto', initials: 'MS', color: 'pink', rut: '13.456.789-0', email: 'maria@eltrigal.cl', position: 'Cajera', active: true, baseSalary: 550000, hireDate: '01/06/2023' },
            { firstName: 'Pedro', lastName: 'Lagos', initials: 'PL', color: 'orange', rut: '14.567.890-1', email: 'pedro@eltrigal.cl', position: 'Repartidor', active: false, baseSalary: 500000, hireDate: '10/08/2023' },
        ]);
    }

    formatMoney(amount: number) {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    }
}
