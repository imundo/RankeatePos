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
    <div class="p-6 bg-slate-50 min-h-screen">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Sucursales</h1>
          <p class="text-slate-500 mt-1">Gestiona las ubicaciones físicas de tu negocio</p>
        </div>
        <button (click)="openModal()" 
                class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
          <lucide-icon name="plus" class="w-5 h-5"></lucide-icon>
          Nueva Sucursal
        </button>
      </div>

      <!-- Branches Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let branch of branches" 
             class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative">
          
          <!-- Principal Badge -->
          <div *ngIf="branch.esPrincipal" 
               class="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <lucide-icon name="star" class="w-3 h-3 fill-amber-700"></lucide-icon>
            Principal
          </div>

          <div class="p-6">
            <div class="flex items-start gap-4 mb-4">
              <div class="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <lucide-icon name="building-2" class="w-6 h-6"></lucide-icon>
              </div>
              <div>
                <h3 class="font-semibold text-lg text-slate-800">{{ branch.nombre }}</h3>
                <p class="text-sm text-slate-500 font-mono">{{ branch.codigo }}</p>
              </div>
            </div>

            <div class="space-y-3 text-sm text-slate-600">
              <div class="flex items-start gap-3">
                <lucide-icon name="map-pin" class="w-4 h-4 mt-0.5 text-slate-400"></lucide-icon>
                <span>{{ branch.direccion }}, {{ branch.comuna }}</span>
              </div>
              <div *ngIf="branch.telefono" class="flex items-center gap-3">
                <lucide-icon name="phone" class="w-4 h-4 text-slate-400"></lucide-icon>
                <span>{{ branch.telefono }}</span>
              </div>
              <div *ngIf="branch.email" class="flex items-center gap-3">
                <lucide-icon name="mail" class="w-4 h-4 text-slate-400"></lucide-icon>
                <span>{{ branch.email }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button *ngIf="!branch.esPrincipal" 
                      (click)="setPrincipal(branch)"
                      title="Establecer como principal"
                      class="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                <lucide-icon name="star" class="w-4 h-4"></lucide-icon>
              </button>
              
              <button (click)="editBranch(branch)" 
                      class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <lucide-icon name="edit-2" class="w-4 h-4"></lucide-icon>
              </button>
              
              <button *ngIf="!branch.esPrincipal" 
                      (click)="deleteBranch(branch)"
                      class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
          </div>
          
          <!-- Status strip -->
          <div class="h-1 w-full" [ngClass]="branch.activa ? 'bg-emerald-500' : 'bg-slate-300'"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="branches.length === 0" class="text-center py-20">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <lucide-icon name="building-2" class="w-8 h-8"></lucide-icon>
        </div>
        <h3 class="text-lg font-medium text-slate-900">No hay sucursales</h3>
        <p class="text-slate-500 mt-2">Comienza agregando tu primera sucursal.</p>
      </div>
    </div>

    <!-- Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-lg font-semibold text-slate-800">
            {{ isEditing ? 'Editar Sucursal' : 'Nueva Sucursal' }}
          </h3>
          <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600">×</button>
        </div>
        
        <form [formGroup]="branchForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">Código</label>
              <input type="text" formControlName="codigo" 
                     [class.bg-slate-100]="isEditing"
                     [readonly]="isEditing"
                     class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                     placeholder="SUC-01">
              <p *ngIf="branchForm.get('codigo')?.touched && branchForm.get('codigo')?.hasError('required')" 
                 class="text-xs text-red-500">Requerido</p>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">Nombre</label>
              <input type="text" formControlName="nombre" 
                     class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                     placeholder="Casa Matriz">
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Dirección</label>
            <input type="text" formControlName="direccion" 
                   class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                   placeholder="Av. Principal 123">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">Comuna</label>
              <input type="text" formControlName="comuna" 
                     class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700">Ciudad</label>
              <input type="text" formControlName="ciudad" 
                     class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Teléfono</label>
            <input type="tel" formControlName="telefono" 
                   class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Email</label>
            <input type="email" formControlName="email" 
                   class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
          </div>

          <div class="pt-4 flex justify-end gap-3">
            <button type="button" (click)="closeModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" 
                    [disabled]="branchForm.invalid || isLoading"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Sucursal') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
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
