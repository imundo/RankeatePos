import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService, Tax } from '@core/services/catalog.service';

@Component({
  selector: 'app-tax-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="section">
      <div class="section-header">
        <h3>🧾 Configuración de Impuestos</h3>
        <button class="btn-add" (click)="openDialog()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nuevo Impuesto
        </button>
      </div>

      <div class="data-table">
        <div class="table-header">
          <span>Nombre</span>
          <span>País/Tipo</span>
          <span>Porcentaje</span>
          <span>Default</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>
        @for (tax of taxes(); track tax.id) {
          <div class="table-row">
            <span class="cell-main">{{ tax.nombre }}</span>
            <span class="cell-secondary">
              {{ tax.pais || '-' }} 
              @if (tax.tipo) { <span class="badge-mini">{{ tax.tipo }}</span> }
            </span>
            <span class="cell-secondary">{{ tax.porcentaje }}%</span>
            <span class="cell-badge" [class.is-default]="tax.esDefault">
              {{ tax.esDefault ? 'Sí' : 'No' }}
            </span>
            <span class="cell-status" [class.active]="tax.activo">
              {{ tax.activo ? 'Activo' : 'Inactivo' }}
            </span>
            <span class="cell-actions">
              <button class="btn-action" (click)="editTax(tax)">✏️</button>
              <button class="btn-action danger" (click)="deleteTax(tax)">🗑️</button>
            </span>
          </div>
        } @empty {
          <div class="empty-state">
            <span>🧾</span>
            <p>No hay impuestos configurados</p>
          </div>
        }
      </div>

      <!-- Modal -->
      @if (showDialog()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>{{ editingTax() ? 'Editar Impuesto' : 'Nuevo Impuesto' }}</h3>
              <button class="btn-close" (click)="closeDialog()">✕</button>
            </div>
            
            <form (ngSubmit)="saveTax()" class="modal-body form-grid">
              <div class="form-group">
                <label>Nombre</label>
                <input type="text" [(ngModel)]="currentTax.nombre" name="nombre" required placeholder="Ej. IVA 19%" class="form-control">
              </div>
              <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label>País</label>
                  <select [(ngModel)]="currentTax.pais" name="pais" class="form-control">
                    <option value="">Seleccionar País...</option>
                    <option value="Chile">Chile</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Mexico">México</option>
                    <option value="Peru">Perú</option>
                    <option value="Argentina">Argentina</option>
                    <option value="España">España</option>
                    <option value="USA">Estados Unidos</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Tipo de Impuesto</label>
                  <select [(ngModel)]="currentTax.tipo" name="tipo" class="form-control">
                    <option value="">Seleccionar Tipo...</option>
                    <option value="IVA">IVA / VAT</option>
                    <option value="Consumo">Impuesto al Consumo / Sales Tax</option>
                    <option value="Retencion">Retención / Withholding</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Porcentaje (%)</label>
                <input type="number" [(ngModel)]="currentTax.porcentaje" name="porcentaje" required min="0" step="0.01" class="form-control">
              </div>
              <div class="form-group checkbox-group">
                <label>
                  <input type="checkbox" [(ngModel)]="currentTax.esDefault" name="esDefault">
                  Es el impuesto por defecto
                </label>
              </div>
              
              <div class="modal-footer">
                <button type="button" class="btn-secondary" (click)="closeDialog()">Cancelar</button>
                <button type="submit" class="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    /* Copy relevant styles from settings or global */
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    h3 { margin: 0; font-size: 1.1rem; color: white; }
    .btn-add { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #6366F1, #8B5CF6); border: none; border-radius: 8px; color: white; cursor: pointer; }
    .btn-add svg { width: 16px; height: 16px; }
    
    .data-table { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; }
    .table-header, .table-row { display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr; gap: 1rem; padding: 1rem 1.25rem; align-items: center; }
    .table-header { background: rgba(255, 255, 255, 0.05); font-size: 0.8rem; font-weight: 600; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; }
    .table-row { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .table-row:last-child { border: none; }
    
    .cell-main { font-weight: 500; color: white; }
    .cell-secondary { color: rgba(255, 255, 255, 0.6); display: flex; align-items: center; gap: 0.5rem; }
    .badge-mini { background: rgba(99, 102, 241, 0.2); color: #818cf8; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 4px; }
    .cell-badge { padding: 0.25rem 0.75rem; background: rgba(255, 255, 255, 0.1); border-radius: 6px; font-size: 0.8rem; color: white; display: inline-block; }
    .cell-badge.is-default { background: rgba(16, 185, 129, 0.2); color: #10B981; }
    .cell-status { padding: 0.25rem 0.75rem; background: rgba(239, 68, 68, 0.2); border-radius: 6px; font-size: 0.8rem; color: #EF4444; }
    .cell-status.active { background: rgba(16, 185, 129, 0.2); color: #10B981; }
    .cell-actions { display: flex; gap: 0.5rem; }
    .btn-action { padding: 0.5rem; background: rgba(255, 255, 255, 0.1); border: none; border-radius: 6px; cursor: pointer; }
    .btn-action.danger:hover { background: rgba(239, 68, 68, 0.3); }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; color: rgba(255, 255, 255, 0.5); }
    .empty-state span { font-size: 3rem; margin-bottom: 1rem; }

    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; width: 100%; max-width: 500px; padding: 1.5rem; color: white; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-header h3 { margin: 0; font-size: 1.25rem; }
    .btn-close { background: transparent; border: none; color: rgba(255,255,255,0.5); font-size: 1.25rem; cursor: pointer; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; color: rgba(255,255,255,0.7); font-size: 0.9rem; }
    .form-control { width: 100%; padding: 0.75rem 1rem; background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; box-sizing: border-box; }
    .checkbox-group { margin-top: 1rem; }
    .checkbox-group label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
    .btn-secondary { padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: white; cursor: pointer; }
    .btn-primary { padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #6366F1, #8B5CF6); border: none; border-radius: 8px; color: white; cursor: pointer; }
  `]
})
export class TaxConfigComponent implements OnInit {
  private catalogService = inject(CatalogService);

  taxes = signal<Tax[]>([]);
  showDialog = signal(false);
  editingTax = signal<Tax | null>(null);
  
  currentTax: Partial<Tax> = {
    nombre: '',
    porcentaje: 0,
    esDefault: false,
    activo: true,
    pais: '',
    tipo: ''
  };

  ngOnInit() {
    this.loadTaxes();
  }

  loadTaxes() {
    this.catalogService.getTaxes().subscribe({
      next: (data) => this.taxes.set(data),
      error: (err) => console.error('Error loading taxes', err)
    });
  }

  openDialog() {
    this.editingTax.set(null);
    this.currentTax = { nombre: '', porcentaje: 0, esDefault: false, activo: true, pais: '', tipo: '' };
    this.showDialog.set(true);
  }

  editTax(tax: Tax) {
    this.editingTax.set(tax);
    this.currentTax = { ...tax };
    this.showDialog.set(true);
  }

  closeDialog() {
    this.showDialog.set(false);
  }

  saveTax() {
    if (this.editingTax()) {
      this.catalogService.updateTax(this.editingTax()!.id, this.currentTax).subscribe({
        next: () => {
          this.loadTaxes();
          this.closeDialog();
        },
        error: (err) => console.error('Error updating tax', err)
      });
    } else {
      this.catalogService.createTax(this.currentTax).subscribe({
        next: () => {
          this.loadTaxes();
          this.closeDialog();
        },
        error: (err) => console.error('Error creating tax', err)
      });
    }
  }

  deleteTax(tax: Tax) {
    if (confirm(`¿Seguro que desea eliminar el impuesto ${tax.nombre}?`)) {
      this.catalogService.deleteTax(tax.id).subscribe({
        next: () => this.loadTaxes(),
        error: (err) => console.error('Error deleting tax', err)
      });
    }
  }
}
