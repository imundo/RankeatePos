import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupplierService, Supplier } from '../../../core/services/supplier.service';
import { SupplierProductsModalComponent } from '../components/supplier-products-modal.component';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SupplierProductsModalComponent],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/compras" class="back-link">← Volver</a>
          <h1>👥 Proveedores</h1>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar proveedor..." [(ngModel)]="searchTerm" (ngModelChange)="onSearch()">
          </div>
          <button class="btn btn-primary" (click)="openModal()">➕ Nuevo Proveedor</button>
        </div>
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
            <span class="stat-value">{{ totalCount() }}</span>
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
                <span class="business-name">{{ supplier.nombre }}</span>
                <span>{{ supplier.contacto || '-' }}</span>
                <span>{{ supplier.telefono || '-' }}</span>
                <span>{{ supplier.email || '-' }}</span>
                <span>
                  <span class="status-badge" [class.active]="supplier.activo">
                    {{ supplier.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </span>
                <span class="actions">
                  <button class="action-btn" title="Productos" (click)="openProductsModal(supplier)">📦</button>
                  <button class="action-btn" title="Editar" (click)="editSupplier(supplier)">✏️</button>
                  <button class="action-btn" title="Eliminar" (click)="deleteSupplier(supplier)">🗑️</button>
                </span>
              </div>
            } @empty {
              <div class="empty-state">
                <p>No hay proveedores registrados</p>
                <button class="btn btn-primary" (click)="openModal()">Agregar Primer Proveedor</button>
              </div>
            }
          </div>
          
          <!-- Pagination -->
          <div class="pagination" *ngIf="totalPages() > 1">
            <button [disabled]="currentPage() === 0" (click)="changePage(currentPage() - 1)">Anterior</button>
            <span>Página {{ currentPage() + 1 }} de {{ totalPages() }}</span>
            <button [disabled]="currentPage() >= totalPages() - 1" (click)="changePage(currentPage() + 1)">Siguiente</button>
          </div>
        </div>
      }

      <!-- Products Modal -->
      @if (showProductsModal()) {
        <app-supplier-products-modal
          [supplier]="selectedSupplierForProducts()"
          (close)="closeProductsModal()">
        </app-supplier-products-modal>
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
                  <input type="text" [(ngModel)]="form.plazoPago" name="plazoPago" placeholder="30 días">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group full-width">
                  <label>Razón Social *</label>
                  <input type="text" [(ngModel)]="form.nombre" name="nombre" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre Contacto</label>
                  <input type="text" [(ngModel)]="form.contacto" name="contacto">
                </div>
                <div class="form-group">
                  <label>Teléfono</label>
                  <input type="tel" [(ngModel)]="form.telefono" name="telefono">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [(ngModel)]="form.email" name="email">
                </div>
                <div class="form-group">
                  <label>Dirección</label>
                  <input type="text" [(ngModel)]="form.direccion" name="direccion">
                </div>
              </div>
              
               <div class="form-row" *ngIf="editingSupplier()">
                <div class="form-group">
                  <label>Estado</label>
                  <div class="status-toggle">
                    <label>
                        <input type="checkbox" [(ngModel)]="form.activo" name="activo"> Activo
                    </label>
                  </div>
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
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.9rem; }
    .back-link:hover { color: #fff; }
    h1 { color: #fff; margin: 0; font-size: 1.8rem; }
    
    .search-box { position: relative; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.5); font-size: 0.9rem; }
    .search-box input { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 12px 8px 32px; color: #fff; width: 200px; transition: all 0.2s; }
    .search-box input:focus { width: 250px; background: rgba(255,255,255,0.15); outline: none; border-color: #667eea; }

    .btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; }
    .btn-secondary:hover { background: rgba(255,255,255,0.2); }

    .stats-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px 24px; display: flex; flex-direction: column; gap: 4px; min-width: 150px; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #60a5fa; }
    .stat-label { font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; }

    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: rgba(255,255,255,0.6); }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .suppliers-table { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; }
    .table-header { display: grid; grid-template-columns: 120px 1.5fr 1fr 110px 1.2fr 80px 100px; gap: 12px; padding: 14px 20px; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.8rem; text-transform: uppercase; }
    .table-body { overflow-y: auto; max-height: 60vh; }
    .table-row { display: grid; grid-template-columns: 120px 1.5fr 1fr 110px 1.2fr 80px 100px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; align-items: center; transition: background 0.2s; }
    .table-row:hover { background: rgba(255,255,255,0.05); }
    .business-name { font-weight: 500; color: #fff; }
    .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .status-badge.active { background: rgba(74,222,128,0.2); color: #4ade80; }
    .actions { display: flex; gap: 8px; }
    .action-btn { background: rgba(255,255,255,0.05); border: none; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: rgba(255,255,255,0.8); }
    .action-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

    .empty-state { padding: 60px; text-align: center; color: rgba(255,255,255,0.5); }
    .empty-state p { margin-bottom: 16px; }

    .pagination { display: flex; justify-content: flex-end; align-items: center; gap: 16px; padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); font-size: 0.9rem; }
    .pagination button { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .pagination button:hover:not(:disabled) { background: rgba(255,255,255,0.15); }

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
    .status-toggle { margin-top: 8px; color: #fff; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 8px; }
    
    @media (max-width: 768px) {
        .table-header, .table-row { grid-template-columns: 1fr 1fr; gap: 8px; }
        .table-header span:nth-child(n+3), .table-row span:nth-child(n+3) { display: none; }
        .table-header span:last-child, .table-row span:last-child { display: block; text-align: right; }
    }
  `]
})
export class ProveedoresComponent implements OnInit {
  suppliers = signal<Supplier[]>([]);
  loading = signal(true);
  showModal = signal(false);
  showProductsModal = signal(false);
  saving = signal(false);
  editingSupplier = signal<Supplier | null>(null);
  selectedSupplierForProducts = signal<Supplier | null>(null);

  // Pagination & Search
  currentPage = signal(0);
  pageSize = signal(10);
  totalPages = signal(0);
  totalCount = signal(0);
  searchTerm = '';

  form: Partial<Supplier> = this.getEmptyForm();

  activeCount = computed(() => this.suppliers().filter(s => s.activo).length);

  constructor(private supplierService: SupplierService) { }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.supplierService.getSuppliers(this.searchTerm, this.currentPage(), this.pageSize()).subscribe({
      next: (data) => {
        this.suppliers.set(data.content || []);
        this.totalPages.set(data.totalPages || 0);
        this.totalCount.set(data.totalElements || 0);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading suppliers:', err);
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadSuppliers();
  }

  changePage(page: number): void {
    this.currentPage.set(page);
    this.loadSuppliers();
  }

  openProductsModal(supplier: Supplier): void {
    this.selectedSupplierForProducts.set(supplier);
    this.showProductsModal.set(true);
  }

  closeProductsModal(): void {
    this.showProductsModal.set(false);
    this.selectedSupplierForProducts.set(null);
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

  deleteSupplier(supplier: Supplier): void {
    if (confirm(`¿Estás seguro de eliminar el proveedor ${supplier.nombre}?`)) {
      this.supplierService.deleteSupplier(supplier.id).subscribe({
        next: () => {
          this.loadSuppliers();
        },
        error: (err) => console.error('Error deleting supplier', err)
      });
    }
  }

  saveSupplier(): void {
    this.saving.set(true);

    const request = this.editingSupplier()
      ? this.supplierService.updateSupplier(this.editingSupplier()!.id, this.form)
      : this.supplierService.createSupplier(this.form);

    request.subscribe({
      next: () => {
        this.loadSuppliers();
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
      nombre: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      plazoPago: '',
      activo: true
    };
  }
}
