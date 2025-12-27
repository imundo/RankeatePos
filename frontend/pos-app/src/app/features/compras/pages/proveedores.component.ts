import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchasesService, Supplier } from '../services/purchases.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/compras" class="back-link">← Volver</a>
        <h1>👥 Proveedores</h1>
        <button class="btn btn-primary" (click)="openModal()">➕ Nuevo Proveedor</button>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando proveedores...</p>
        </div>
      } @else {
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">{{ activeCount() }}</span>
            <span class="stat-label">Proveedores Activos</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ suppliers().length }}</span>
            <span class="stat-label">Total Registrados</span>
          </div>
        </div>

        <div class="suppliers-table">
          <div class="table-header">
            <span>RUT</span>
            <span>Razón Social</span>
            <span>Contacto</span>
            <span>Teléfono</span>
            <span>Email</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          <div class="table-body">
            @for (supplier of suppliers(); track supplier.id) {
              <div class="table-row">
                <span>{{ supplier.rut }}</span>
                <span class="business-name">{{ supplier.businessName }}</span>
                <span>{{ supplier.contactName || '-' }}</span>
                <span>{{ supplier.phone || '-' }}</span>
                <span>{{ supplier.email || '-' }}</span>
                <span><span class="status-badge" [class.active]="supplier.isActive">{{ supplier.isActive ? 'Activo' : 'Inactivo' }}</span></span>
                <span class="actions">
                  <button class="action-btn" title="Editar" (click)="editSupplier(supplier)">✏️</button>
                  <button class="action-btn" title="Ver" (click)="viewSupplier(supplier)">👁️</button>
                </span>
              </div>
            } @empty {
              <div class="empty-state">
                <p>No hay proveedores registrados</p>
                <button class="btn btn-primary" (click)="openModal()">Agregar Primer Proveedor</button>
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
              <h2>{{ editingSupplier() ? 'Editar' : 'Nuevo' }} Proveedor</h2>
              <button class="close-btn" (click)="closeModal()">✕</button>
            </div>
            <form (ngSubmit)="saveSupplier()" class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label>RUT *</label>
                  <input type="text" [(ngModel)]="form.rut" name="rut" placeholder="76.123.456-7" required>
                </div>
                <div class="form-group">
                  <label>Días de Pago</label>
                  <input type="number" [(ngModel)]="form.paymentTerms" name="paymentTerms" placeholder="30">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group full-width">
                  <label>Razón Social *</label>
                  <input type="text" [(ngModel)]="form.businessName" name="businessName" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group full-width">
                  <label>Nombre de Fantasía</label>
                  <input type="text" [(ngModel)]="form.fantasyName" name="fantasyName">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre Contacto</label>
                  <input type="text" [(ngModel)]="form.contactName" name="contactName">
                </div>
                <div class="form-group">
                  <label>Teléfono</label>
                  <input type="tel" [(ngModel)]="form.phone" name="phone">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [(ngModel)]="form.email" name="email">
                </div>
                <div class="form-group">
                  <label>Dirección</label>
                  <input type="text" [(ngModel)]="form.address" name="address">
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
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
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
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #60a5fa; }
    .stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; }

    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: rgba(255,255,255,0.6); }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .suppliers-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; }
    .table-header { display: grid; grid-template-columns: 120px 1.5fr 1fr 110px 1.2fr 80px 90px; gap: 12px; padding: 14px 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .table-body { max-height: 60vh; overflow-y: auto; }
    .table-row { display: grid; grid-template-columns: 120px 1.5fr 1fr 110px 1.2fr 80px 90px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; align-items: center; transition: background 0.2s; }
    .table-row:hover { background: rgba(255,255,255,0.03); }
    .business-name { font-weight: 500; }
    .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: rgba(156,163,175,0.2); color: #9ca3af; }
    .status-badge.active { background: rgba(74,222,128,0.2); color: #4ade80; }
    .actions { display: flex; gap: 8px; }
    .action-btn { background: rgba(255,255,255,0.05); border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
    .action-btn:hover { background: rgba(255,255,255,0.15); }

    .empty-state { padding: 60px; text-align: center; color: rgba(255,255,255,0.5); }
    .empty-state p { margin-bottom: 16px; }

    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
    .modal-content { background: #1a1a3e; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 90%; max-width: 550px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .modal-header h2 { margin: 0; color: #fff; font-size: 1.25rem; }
    .close-btn { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 1.5rem; cursor: pointer; }
    .modal-body { padding: 24px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 0.85rem; color: rgba(255,255,255,0.7); }
    .form-group input { padding: 10px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 0.95rem; }
    .form-group input:focus { outline: none; border-color: #667eea; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 8px; }
  `]
})
export class ProveedoresComponent implements OnInit {
  suppliers = signal<Supplier[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editingSupplier = signal<Supplier | null>(null);

  form: Partial<Supplier> = this.getEmptyForm();

  activeCount = computed(() => this.suppliers().filter(s => s.isActive).length);

  constructor(private purchasesService: PurchasesService) { }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.purchasesService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.loading.set(false);
      }
    });
  }

  openModal(): void {
    this.editingSupplier.set(null);
    this.form = this.getEmptyForm();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingSupplier.set(null);
  }

  editSupplier(supplier: Supplier): void {
    this.editingSupplier.set(supplier);
    this.form = { ...supplier };
    this.showModal.set(true);
  }

  viewSupplier(supplier: Supplier): void {
    this.editSupplier(supplier);
  }

  saveSupplier(): void {
    this.saving.set(true);
    this.purchasesService.createSupplier(this.form).subscribe({
      next: (created) => {
        this.suppliers.update(list => [...list, created]);
        this.closeModal();
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error saving supplier:', err);
        this.saving.set(false);
      }
    });
  }

  private getEmptyForm(): Partial<Supplier> {
    return {
      rut: '',
      businessName: '',
      fantasyName: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      paymentTerms: 30,
      isActive: true
    };
  }
}
