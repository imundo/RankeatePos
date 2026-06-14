import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BranchService, Branch } from '../../core/services/branches.service';
import { LucideAngularModule, Building2, MapPin, Phone, Mail, Plus, Edit2, Trash2, CheckCircle2, Star } from 'lucide-angular';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="branches-container">
      <!-- Header -->
      <div class="section-header">
        <div class="header-content">
          <h2 class="section-title">📍 Gestión de Sucursales</h2>
          <p class="section-subtitle">Administra las ubicaciones físicas de tu negocio</p>
        </div>
        <button (click)="openModal()" class="btn-primary">
          <lucide-icon name="plus" class="w-5 h-5"></lucide-icon>
          Nueva Sucursal
        </button>
      </div>

      <!-- Branches Grid -->
      <div class="branches-grid">
        <div *ngFor="let branch of branches" class="branch-card" [class.inactive]="!branch.activa">
          
          <!-- Principal Badge -->
          <div *ngIf="branch.esPrincipal" class="principal-badge">
            <lucide-icon name="star" class="w-3 h-3"></lucide-icon>
            Principal
          </div>

          <div class="card-content">
            <div class="card-header">
              <div class="branch-icon">
                <lucide-icon name="building-2" class="w-6 h-6"></lucide-icon>
              </div>
              <div class="branch-titles">
                <h3>{{ branch.nombre }}</h3>
                <span class="branch-code">{{ branch.codigo }}</span>
              </div>
            </div>

            <div class="branch-details">
              <div class="detail-row">
                <lucide-icon name="map-pin" class="w-4 h-4"></lucide-icon>
                <span>{{ branch.direccion }}, {{ branch.comuna }}</span>
              </div>
              <div *ngIf="branch.telefono" class="detail-row">
                <lucide-icon name="phone" class="w-4 h-4"></lucide-icon>
                <span>{{ branch.telefono }}</span>
              </div>
              <div *ngIf="branch.email" class="detail-row">
                <lucide-icon name="mail" class="w-4 h-4"></lucide-icon>
                <span>{{ branch.email }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="card-actions">
              <button *ngIf="!branch.esPrincipal" 
                      (click)="setPrincipal(branch)"
                      title="Establecer como principal"
                      class="btn-icon-action btn-star">
                <lucide-icon name="star" class="w-4 h-4"></lucide-icon>
              </button>
              
              <button (click)="editBranch(branch)" 
                      class="btn-icon-action btn-edit"
                      title="Editar">
                <lucide-icon name="edit-2" class="w-4 h-4"></lucide-icon>
              </button>
              
              <button *ngIf="!branch.esPrincipal" 
                      (click)="deleteBranch(branch)"
                      class="btn-icon-action btn-delete"
                      title="Eliminar">
                <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
          </div>
          
          <!-- Status strip -->
          <div class="status-strip" [ngClass]="branch.activa ? 'active' : 'inactive'"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="branches.length === 0" class="empty-state">
        <div class="empty-icon">
          <lucide-icon name="building-2" class="w-8 h-8"></lucide-icon>
        </div>
        <h3>No hay sucursales</h3>
        <p>Comienza agregando tu primera sucursal para expandir tu negocio.</p>
      </div>
    </div>

    <!-- Modal Premium -->
    <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Editar Sucursal' : 'Nueva Sucursal' }}</h2>
          <button (click)="closeModal()" class="close-btn">×</button>
        </div>
        
        <form [formGroup]="branchForm" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-section">
            <h4 class="section-label">Información Básica</h4>
            <div class="form-row">
              <div class="form-group">
                <label>Código Interno</label>
                <input type="text" formControlName="codigo" 
                       [readonly]="isEditing"
                       [class.readonly]="isEditing"
                       placeholder="Ej: SUC-01">
                <span class="error-msg" *ngIf="branchForm.get('codigo')?.touched && branchForm.get('codigo')?.hasError('required')">
                  El código es requerido
                </span>
              </div>
              <div class="form-group">
                <label>Nombre de la Sucursal</label>
                <input type="text" formControlName="nombre" placeholder="Ej: Casa Matriz">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4 class="section-label">Ubicación y Contacto</h4>
            <div class="form-group full-width">
              <label>Dirección</label>
              <input type="text" formControlName="direccion" placeholder="Ej: Av. Principal 123">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Comuna</label>
                <input type="text" formControlName="comuna" placeholder="Ej: Providencia">
              </div>
              <div class="form-group">
                <label>Ciudad</label>
                <input type="text" formControlName="ciudad" placeholder="Ej: Santiago">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Teléfono (opcional)</label>
                <input type="tel" formControlName="telefono" placeholder="Ej: +56 9 1234 5678">
              </div>
              <div class="form-group">
                <label>Email (opcional)</label>
                <input type="email" formControlName="email" placeholder="Ej: sucursal@empresa.com">
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" (click)="closeModal()" class="btn-secondary">Cancelar</button>
            <button type="submit" 
                    [disabled]="branchForm.invalid || isLoading"
                    class="btn-primary">
              {{ isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Sucursal' : 'Crear Sucursal') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .branches-container {
      animation: fadeIn 0.4s ease;
      color: #fff;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .section-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(to right, #fff, #a5b4fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .section-subtitle {
      margin: 0.25rem 0 0;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
      transition: all 0.3s ease;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .branches-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .branch-card {
      position: relative;
      background: rgba(30, 30, 50, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .branch-card:hover {
      transform: translateY(-4px);
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      background: rgba(40, 40, 70, 0.5);
    }

    .branch-card.inactive {
      opacity: 0.7;
      filter: grayscale(0.5);
    }

    .principal-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1));
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fcd34d;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      box-shadow: 0 2px 10px rgba(245, 158, 11, 0.1);
    }

    .card-content {
      padding: 1.5rem;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .branch-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.05));
      border: 1px solid rgba(99, 102, 241, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #818cf8;
    }

    .branch-titles h3 {
      margin: 0 0 0.25rem;
      font-size: 1.15rem;
      font-weight: 600;
      color: #fff;
    }

    .branch-code {
      font-size: 0.75rem;
      font-family: monospace;
      color: rgba(255, 255, 255, 0.4);
      background: rgba(0, 0, 0, 0.2);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }

    .branch-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      flex-grow: 1;
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.65);
      line-height: 1.4;
    }

    .detail-row lucide-icon {
      color: #6366f1;
      opacity: 0.8;
      margin-top: 0.1rem;
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .btn-icon-action {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-icon-action:hover {
      transform: translateY(-2px);
    }

    .btn-star:hover { background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); color: #fbbf24; }
    .btn-edit:hover { background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3); color: #818cf8; }
    .btn-delete:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171; }

    .status-strip {
      height: 4px;
      width: 100%;
    }
    
    .status-strip.active { background: linear-gradient(90deg, #10b981, #059669); }
    .status-strip.inactive { background: linear-gradient(90deg, #64748b, #475569); }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      text-align: center;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.05);
      color: rgba(99, 102, 241, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .empty-state h3 { font-size: 1.25rem; margin: 0 0 0.5rem; color: #fff; }
    .empty-state p { color: rgba(255, 255, 255, 0.5); margin: 0; max-width: 300px; }

    /* Modal Premium UI */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(10, 10, 25, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }

    .modal-content {
      background: linear-gradient(145deg, rgba(30, 30, 60, 0.95), rgba(15, 15, 30, 0.98));
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border-radius: 20px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      top: 0;
      background: rgba(20, 20, 40, 0.9);
      backdrop-filter: blur(10px);
      z-index: 10;
      border-radius: 20px 20px 0 0;
    }

    .modal-header h2 { margin: 0; font-size: 1.3rem; color: #fff; font-weight: 700; }

    .close-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.6);
      width: 36px; height: 36px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: 1.25rem;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }

    .modal-body {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      background: rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      padding: 1.5rem;
    }

    .section-label {
      color: #818cf8;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section-label::before {
      content: '';
      display: block;
      width: 6px; height: 6px;
      background: #6366f1;
      border-radius: 50%;
      box-shadow: 0 0 8px #6366f1;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }

    .form-row:last-child { margin-bottom: 0; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group.full-width { grid-column: 1 / -1; margin-bottom: 1.25rem; }

    .form-group label {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    .form-group input {
      padding: 0.85rem 1rem;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #fff;
      font-size: 0.95rem;
      font-family: inherit;
      transition: all 0.3s ease;
      width: 100%;
    }

    .form-group input:hover:not(.readonly) {
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(0, 0, 0, 0.3);
    }

    .form-group input:focus:not(.readonly) {
      outline: none;
      border-color: #818cf8;
      background: rgba(99, 102, 241, 0.05);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .form-group input::placeholder { color: rgba(255, 255, 255, 0.2); }

    .form-group input.readonly {
      background: rgba(255, 255, 255, 0.02);
      color: rgba(255, 255, 255, 0.4);
      border-color: rgba(255, 255, 255, 0.05);
      cursor: not-allowed;
    }

    .error-msg {
      color: #f87171;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem 2rem;
      background: rgba(20, 20, 40, 0.95);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      bottom: 0;
      border-radius: 0 0 20px 20px;
    }

    .btn-secondary {
      padding: 0.75rem 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; gap: 1rem; }
      .section-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .btn-primary { width: 100%; justify-content: center; }
      .modal-content { width: 95%; padding: 0; }
      .modal-body { padding: 1.5rem; gap: 1.5rem; }
      .modal-footer { flex-direction: column-reverse; }
      .btn-secondary, .btn-primary { width: 100%; }
    }
  `]
})
export class BranchesComponent implements OnInit {
  private branchService = inject(BranchService);
  private fb = inject(FormBuilder);

  branches: Branch[] = [];
  showModal = false;
  isEditing = false;
  isLoading = false;
  editingId: string | null = null;

  branchForm: FormGroup = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern('^[A-Z0-9-]+$')]],
    nombre: ['', Validators.required],
    direccion: ['', Validators.required],
    comuna: ['', Validators.required],
    ciudad: [''],
    telefono: [''],
    email: ['', [Validators.email]]
  });

  ngOnInit() {
    this.loadBranches();
  }

  loadBranches() {
    this.branchService.getBranches().subscribe({
      next: (data) => this.branches = data,
      error: (err) => console.error('Error loading branches', err)
    });
  }

  openModal() {
    this.isEditing = false;
    this.editingId = null;
    this.branchForm.reset();
    this.showModal = true;
  }

  editBranch(branch: Branch) {
    this.isEditing = true;
    this.editingId = branch.id;
    this.branchForm.patchValue(branch);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.branchForm.reset();
  }

  onSubmit() {
    if (this.branchForm.invalid) return;

    this.isLoading = true;
    const data = this.branchForm.value;

    const request = this.isEditing && this.editingId
      ? this.branchService.updateBranch(this.editingId, data)
      : this.branchService.createBranch(data);

    request.subscribe({
      next: () => {
        this.loadBranches();
        this.closeModal();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error saving branch', err);
        this.isLoading = false;
        // Should show toast
      }
    });
  }

  deleteBranch(branch: Branch) {
    if (confirm(`¿Estás seguro de eliminar la sucursal ${branch.nombre}?`)) {
      this.branchService.deleteBranch(branch.id).subscribe({
        next: () => this.loadBranches(),
        error: (err) => console.error('Error deleting branch', err)
      });
    }
  }

  setPrincipal(branch: Branch) {
    this.branchService.setPrincipal(branch.id).subscribe({
      next: () => this.loadBranches(),
      error: (err) => console.error('Error setting principal branch', err)
    });
  }
}
