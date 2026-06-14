import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService, Category, CategoryRequest } from '@core/services/catalog.service';

@Component({
  selector: 'app-category-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="section">
      <div class="section-header">
        <h3>🗂️ Configuración de Categorías</h3>
        <button class="btn-add" (click)="openDialog()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nueva Categoría
        </button>
      </div>

      <div class="data-table">
        <div class="table-header">
          <span>Icono</span>
          <span>Nombre</span>
          <span>Descripción</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>
        @for (cat of categories(); track cat.id) {
          <div class="table-row">
            <span class="cell-main category-icon">{{ cat.icono || '📁' }}</span>
            <span class="cell-main">{{ cat.nombre }}</span>
            <span class="cell-secondary">{{ cat.descripcion || 'Sin descripción' }}</span>
            <span class="cell-status" [class.active]="cat.activa">
              {{ cat.activa ? 'Activo' : 'Inactivo' }}
            </span>
            <span class="cell-actions">
              <button class="btn-action" (click)="editCategory(cat)">✏️</button>
              <button class="btn-action danger" (click)="deleteCategory(cat)">🗑️</button>
            </span>
          </div>
        } @empty {
          <div class="empty-state">
            <span>🗂️</span>
            <p>No hay categorías configuradas</p>
          </div>
        }
      </div>

      <!-- Modal -->
      @if (showDialog()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>{{ editingCategory() ? 'Editar Categoría' : 'Nueva Categoría' }}</h3>
              <button class="btn-close" (click)="closeDialog()">✕</button>
            </div>
            
            <form (ngSubmit)="saveCategory()" class="modal-body">
              
              <div class="form-group icon-group">
                <label>Icono (Emoji)</label>
                <div class="emoji-grid">
                  @for (emoji of commonEmojis; track $index) {
                    <button type="button" 
                            class="emoji-btn" 
                            [class.selected]="currentCategory.icono === emoji" 
                            (click)="currentCategory.icono = emoji">
                      {{ emoji }}
                    </button>
                  }
                </div>
                <div class="custom-icon-wrapper" style="margin-top: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                   <span style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">O ingresa uno manualmente:</span>
                   <input type="text" [(ngModel)]="currentCategory.icono" name="icono" class="form-control" style="width: 60px; text-align: center; padding: 0.25rem;" maxlength="2">
                </div>
              </div>

              <div class="form-group">
                <label>Nombre de Categoría</label>
                <input type="text" [(ngModel)]="currentCategory.nombre" name="nombre" required placeholder="Ej. Panadería" class="form-control">
              </div>
              
              <div class="form-group">
                <label>Descripción</label>
                <input type="text" [(ngModel)]="currentCategory.descripcion" name="descripcion" placeholder="Opcional" class="form-control">
              </div>
              
              <div class="form-group">
                <label>Orden (Prioridad)</label>
                <input type="number" [(ngModel)]="currentCategory.orden" name="orden" min="0" class="form-control">
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
    /* Copy relevant styles from tax-config or settings */
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    h3 { margin: 0; font-size: 1.1rem; color: white; }
    .btn-add { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #6366F1, #8B5CF6); border: none; border-radius: 8px; color: white; cursor: pointer; }
    .btn-add svg { width: 16px; height: 16px; }
    
    .data-table { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; }
    .table-header, .table-row { display: grid; grid-template-columns: 0.5fr 2fr 2fr 1fr 1fr; gap: 1rem; padding: 1rem 1.25rem; align-items: center; }
    .table-header { background: rgba(255, 255, 255, 0.05); font-size: 0.8rem; font-weight: 600; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; }
    .table-row { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .table-row:last-child { border: none; }
    
    .category-icon { font-size: 1.5rem; text-align: center; }
    
    .cell-main { font-weight: 500; color: white; }
    .cell-secondary { color: rgba(255, 255, 255, 0.6); }
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
    
    /* Emoji Grid */
    .emoji-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 0.5rem; margin-bottom: 0.5rem; }
    .emoji-btn { background: rgba(255,255,255,0.05); border: 1px solid transparent; border-radius: 8px; font-size: 1.5rem; padding: 0.5rem; cursor: pointer; transition: all 0.2s; }
    .emoji-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }
    .emoji-btn.selected { background: rgba(99, 102, 241, 0.2); border-color: #6366f1; transform: scale(1.1); }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; color: rgba(255,255,255,0.7); font-size: 0.9rem; }
    .form-control { width: 100%; padding: 0.75rem 1rem; background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; box-sizing: border-box; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
    .btn-secondary { padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: white; cursor: pointer; }
    .btn-primary { padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #6366F1, #8B5CF6); border: none; border-radius: 8px; color: white; cursor: pointer; }
  `]
})
export class CategoryConfigComponent implements OnInit {
  private catalogService = inject(CatalogService);

  commonEmojis = ['🍔', '🍕', '☕', '🍰', '👕', '🛍️', '📦', '🛒', '🌮', '🥩', '🥖', '🥦', '🍉', '🥐', '🍦', '🍷'];

  categories = signal<Category[]>([]);
  showDialog = signal(false);
  editingCategory = signal<Category | null>(null);
  
  currentCategory: CategoryRequest = {
    nombre: '',
    descripcion: '',
    icono: '',
    orden: 0
  };

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.catalogService.getCategories().subscribe({
      next: (data) => {
        // Sort by orden
        data.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        this.categories.set(data);
      },
      error: (err) => console.error('Error loading categories', err)
    });
  }

  openDialog() {
    this.editingCategory.set(null);
    this.currentCategory = { nombre: '', descripcion: '', icono: '', orden: 0 };
    this.showDialog.set(true);
  }

  editCategory(cat: Category) {
    this.editingCategory.set(cat);
    this.currentCategory = { 
        nombre: cat.nombre, 
        descripcion: cat.descripcion,
        icono: cat.icono,
        orden: cat.orden 
    };
    this.showDialog.set(true);
  }

  closeDialog() {
    this.showDialog.set(false);
  }

  saveCategory() {
    if (this.editingCategory()) {
      this.catalogService.updateCategory(this.editingCategory()!.id, this.currentCategory).subscribe({
        next: () => {
          this.loadCategories();
          this.closeDialog();
        },
        error: (err) => console.error('Error updating category', err)
      });
    } else {
      this.catalogService.createCategory(this.currentCategory).subscribe({
        next: () => {
          this.loadCategories();
          this.closeDialog();
        },
        error: (err) => console.error('Error creating category', err)
      });
    }
  }

  deleteCategory(cat: Category) {
    if (confirm(`¿Seguro que desea eliminar la categoría ${cat.nombre}?`)) {
      this.catalogService.deleteCategory(cat.id).subscribe({
        next: () => this.loadCategories(),
        error: (err) => console.error('Error deleting category', err)
      });
    }
  }
}
