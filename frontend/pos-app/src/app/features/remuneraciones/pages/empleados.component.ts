import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-empleados',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/remuneraciones" class="back-link">← Volver</a>
        <h1>👥 Empleados</h1>
        <button class="btn btn-primary" (click)="addEmployee()">➕ Nuevo Empleado</button>
      </header>

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
              <span class="emp-name">{{ emp.name }}</span>
              <span>{{ emp.position }}</span>
              <span>{{ emp.department }}</span>
              <span class="salary">{{ emp.baseSalary | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
              <span><span class="status-badge" [class.active]="emp.isActive">{{ emp.isActive ? 'Activo' : 'Inactivo' }}</span></span>
              <span class="actions">
                <button class="action-btn" (click)="editEmployee(emp)">✏️</button>
                <button class="action-btn" (click)="viewEmployee(emp)">👁️</button>
              </span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; }
    h1 { color: #fff; margin: 0; flex: 1; }
    .btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .employees-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 110px 1.5fr 1fr 1fr 120px 80px 100px; gap: 12px; padding: 14px 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .table-body { max-height: 60vh; overflow-y: auto; }
    .table-row { display: grid; grid-template-columns: 110px 1.5fr 1fr 1fr 120px 80px 100px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; align-items: center; }
    .emp-name { font-weight: 500; }
    .salary { color: #4ade80; font-weight: 600; }
    .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: rgba(156,163,175,0.2); color: #9ca3af; }
    .status-badge.active { background: rgba(74,222,128,0.2); color: #4ade80; }
    .actions { display: flex; gap: 8px; }
    .action-btn { background: rgba(255,255,255,0.05); border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
  `]
})
export class EmpleadosComponent {
    employees = signal([
        { id: '1', rut: '12.345.678-9', name: 'Juan Pérez González', position: 'Vendedor', department: 'Ventas', baseSalary: 650000, isActive: true },
        { id: '2', rut: '14.567.890-1', name: 'María López Soto', position: 'Cajera', department: 'Ventas', baseSalary: 520000, isActive: true },
        { id: '3', rut: '15.789.012-3', name: 'Carlos Muñoz Vera', position: 'Bodeguero', department: 'Logística', baseSalary: 480000, isActive: true },
        { id: '4', rut: '16.901.234-5', name: 'Ana Torres Rivera', position: 'Contador', department: 'Finanzas', baseSalary: 850000, isActive: true }
    ]);

    addEmployee(): void { console.log('Add employee'); }
    editEmployee(emp: any): void { console.log('Edit:', emp.id); }
    viewEmployee(emp: any): void { console.log('View:', emp.id); }
}
