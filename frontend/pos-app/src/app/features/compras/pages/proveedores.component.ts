import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-proveedores',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/compras" class="back-link">← Volver</a>
        <h1>👥 Proveedores</h1>
        <button class="btn btn-primary" (click)="showNewSupplierModal = true">➕ Nuevo Proveedor</button>
      </header>

      <div class="suppliers-table">
        <div class="table-header">
          <span>RUT</span>
          <span>Razón Social</span>
          <span>Contacto</span>
          <span>Teléfono</span>
          <span>Email</span>
          <span>Acciones</span>
        </div>
        <div class="table-body">
          @for (supplier of suppliers(); track supplier.id) {
            <div class="table-row">
              <span>{{ supplier.rut }}</span>
              <span>{{ supplier.businessName }}</span>
              <span>{{ supplier.contactName }}</span>
              <span>{{ supplier.phone }}</span>
              <span>{{ supplier.email }}</span>
              <span class="actions">
                <button class="action-btn" (click)="editSupplier(supplier)">✏️</button>
                <button class="action-btn" (click)="viewSupplier(supplier)">👁️</button>
              </span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; }
    h1 { color: #fff; margin: 0; flex: 1; }
    .btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .suppliers-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 120px 2fr 1fr 1fr 1.5fr 100px; gap: 12px; padding: 14px 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .table-body { max-height: 60vh; overflow-y: auto; }
    .table-row { display: grid; grid-template-columns: 120px 2fr 1fr 1fr 1.5fr 100px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; align-items: center; }
    .actions { display: flex; gap: 8px; }
    .action-btn { background: rgba(255,255,255,0.05); border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
  `]
})
export class ProveedoresComponent {
    showNewSupplierModal = false;

    suppliers = signal([
        { id: '1', rut: '76.123.456-7', businessName: 'Proveedor Central S.A.', contactName: 'Juan Pérez', phone: '+56 9 1234 5678', email: 'contacto@central.cl' },
        { id: '2', rut: '77.456.789-0', businessName: 'Distribuidora Norte Ltda.', contactName: 'María López', phone: '+56 9 8765 4321', email: 'ventas@norte.cl' },
        { id: '3', rut: '78.789.012-3', businessName: 'Importadora ABC SpA', contactName: 'Carlos Gómez', phone: '+56 2 2345 6789', email: 'info@abc.cl' }
    ]);

    editSupplier(supplier: any): void { console.log('Edit:', supplier.id); }
    viewSupplier(supplier: any): void { console.log('View:', supplier.id); }
}
