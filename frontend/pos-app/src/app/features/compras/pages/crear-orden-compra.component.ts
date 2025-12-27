import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-crear-orden-compra',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/compras/ordenes-compra" class="back-link">← Volver</a>
        <h1>➕ Nueva Orden de Compra</h1>
      </header>

      <div class="form-container">
        <div class="form-section">
          <h2>Información General</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Proveedor</label>
              <select [(ngModel)]="selectedSupplier" class="form-control">
                <option value="">Seleccionar...</option>
                @for (supplier of suppliers(); track supplier.id) {
                  <option [value]="supplier.id">{{ supplier.businessName }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Fecha Entrega Esperada</label>
              <input type="date" [(ngModel)]="expectedDate" class="form-control" />
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <h2>Productos</h2>
            <button class="btn btn-secondary" (click)="addItem()">➕ Agregar Producto</button>
          </div>
          <div class="items-table">
            <div class="items-header">
              <span>Producto</span>
              <span>Cantidad</span>
              <span>Precio Unit.</span>
              <span>Subtotal</span>
              <span></span>
            </div>
            @for (item of items(); track $index) {
              <div class="item-row">
                <input type="text" [(ngModel)]="item.name" class="form-control" placeholder="Nombre producto" />
                <input type="number" [(ngModel)]="item.quantity" class="form-control" />
                <input type="number" [(ngModel)]="item.unitPrice" class="form-control" />
                <span class="subtotal">{{ item.quantity * item.unitPrice | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
                <button class="remove-btn" (click)="removeItem($index)">🗑️</button>
              </div>
            }
          </div>
          <div class="totals">
            <span>Subtotal: {{ calculateSubtotal() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            <span>IVA (19%): {{ calculateTax() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
            <span class="total">Total: {{ calculateTotal() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-outline" routerLink="/compras/ordenes-compra">Cancelar</button>
          <button class="btn btn-secondary" (click)="saveDraft()">💾 Guardar Borrador</button>
          <button class="btn btn-primary" (click)="saveAndApprove()">✅ Guardar y Aprobar</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container { padding: 24px; min-height: 100vh; background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); }
    .page-header { margin-bottom: 24px; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; display: block; margin-bottom: 8px; }
    h1, h2 { color: #fff; margin: 0; }
    .form-container { max-width: 1000px; }
    .form-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
    .form-section h2 { font-size: 1.1rem; margin-bottom: 16px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-header h2 { margin: 0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { color: rgba(255,255,255,0.7); font-size: 0.9rem; }
    .form-control { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 12px 16px; color: #fff; }
    .form-control:focus { outline: none; border-color: #667eea; }
    .form-control option { background: #1a1a3e; }
    .items-table { margin-bottom: 16px; }
    .items-header { display: grid; grid-template-columns: 2fr 100px 120px 120px 50px; gap: 12px; padding: 10px; color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .item-row { display: grid; grid-template-columns: 2fr 100px 120px 120px 50px; gap: 12px; padding: 10px 0; align-items: center; }
    .item-row .form-control { padding: 10px; }
    .subtotal { color: #4ade80; font-weight: 600; }
    .remove-btn { background: rgba(239,68,68,0.1); border: none; padding: 8px; border-radius: 8px; cursor: pointer; }
    .totals { display: flex; justify-content: flex-end; gap: 32px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
    .total { color: #fff; font-size: 1.25rem; font-weight: 700; }
    .form-actions { display: flex; justify-content: flex-end; gap: 16px; }
    .btn { padding: 12px 24px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }
    .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); }
  `]
})
export class CrearOrdenCompraComponent {
    selectedSupplier = '';
    expectedDate = '';

    suppliers = signal([
        { id: '1', businessName: 'Proveedor Central S.A.' },
        { id: '2', businessName: 'Distribuidora Norte Ltda.' },
        { id: '3', businessName: 'Importadora ABC SpA' }
    ]);

    items = signal([
        { name: '', quantity: 1, unitPrice: 0 }
    ]);

    addItem(): void { this.items.update(items => [...items, { name: '', quantity: 1, unitPrice: 0 }]); }
    removeItem(index: number): void { this.items.update(items => items.filter((_, i) => i !== index)); }

    calculateSubtotal(): number { return this.items().reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0); }
    calculateTax(): number { return this.calculateSubtotal() * 0.19; }
    calculateTotal(): number { return this.calculateSubtotal() + this.calculateTax(); }

    saveDraft(): void { console.log('Save draft'); }
    saveAndApprove(): void { console.log('Save and approve'); }
}
