import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, Role, ModuleConfig } from '../../core/services/admin.service';

@Component({
    selector: 'app-role-manager',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    template: `
    <div class="p-6 bg-slate-50 min-h-screen">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Gestión de Roles</h1>
          <p class="text-slate-500 mt-1">Administra los roles y permisos del sistema</p>
        </div>
        <button (click)="openModal()" 
                class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Rol
        </button>
      </div>

      <!-- Roles Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let role of roles" 
             class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          
          <!-- System Role Badge -->
          <div class="p-5 pb-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                     [class]="role.esSistema ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-800">{{ role.nombre }}</h3>
                  <span *ngIf="role.esSistema" class="text-xs text-amber-600 font-medium">Sistema</span>
                  <span *ngIf="!role.esSistema && !role.tenantId" class="text-xs text-indigo-600 font-medium">Global</span>
                  <span *ngIf="role.tenantId" class="text-xs text-slate-500">Personalizado</span>
                </div>
              </div>
              
              <div *ngIf="!role.esSistema" class="flex gap-1">
                <button (click)="editRole(role)" 
                        class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button (click)="deleteRole(role)" 
                        class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <p *ngIf="role.descripcion" class="text-sm text-slate-500 mb-4">{{ role.descripcion }}</p>
            
            <!-- Permissions Preview -->
            <div class="flex flex-wrap gap-1.5">
              <span *ngFor="let perm of (role.permisos || []).slice(0, 5)" 
                    class="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                {{ formatPermission(perm) }}
              </span>
              <span *ngIf="(role.permisos || []).length > 5" 
                    class="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-500">
                +{{ (role.permisos || []).length - 5 }} más
              </span>
              <span *ngIf="!(role.permisos || []).length" class="text-sm text-slate-400 italic">
                Sin permisos asignados
              </span>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <span class="text-xs text-slate-500">
              {{ (role.permisos || []).length }} permisos
            </span>
            <button (click)="openPermissionsEditor(role)"
                    [disabled]="role.esSistema"
                    class="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Editar Permisos →
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="roles.length === 0 && !loading" class="text-center py-20">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900">No hay roles</h3>
        <p class="text-slate-500 mt-2">Comienza creando tu primer rol personalizado.</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-lg font-semibold text-slate-800">
            {{ editingRole ? 'Editar Rol' : 'Nuevo Rol' }}
          </h3>
          <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        
        <form [formGroup]="roleForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Nombre del Rol</label>
            <input type="text" formControlName="nombre" 
                   class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                   placeholder="Ej: Supervisor de Tienda">
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Descripción</label>
            <textarea formControlName="descripcion" rows="2"
                      class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Descripción del rol y sus responsabilidades"></textarea>
          </div>

          <div class="pt-4 flex justify-end gap-3">
            <button type="button" (click)="closeModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" 
                    [disabled]="roleForm.invalid || saving"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {{ saving ? 'Guardando...' : (editingRole ? 'Actualizar' : 'Crear Rol') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Permissions Editor Modal -->
    <div *ngIf="showPermissionsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 class="text-lg font-semibold text-slate-800">
            Permisos: {{ selectedRole?.nombre }}
          </h3>
          <button (click)="closePermissionsModal()" class="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1">
          <div *ngFor="let category of permissionCategories" class="mb-6">
            <h4 class="font-medium text-slate-700 mb-3 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
              {{ category.name }}
            </h4>
            <div class="grid grid-cols-2 gap-2">
              <label *ngFor="let perm of category.permissions" 
                     class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input type="checkbox" 
                       [checked]="isPermissionSelected(perm.code)"
                       (change)="togglePermission(perm.code)"
                       class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500">
                <span class="text-sm text-slate-700">{{ perm.name }}</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button (click)="closePermissionsModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button (click)="savePermissions()" 
                  [disabled]="saving"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50">
            {{ saving ? 'Guardando...' : 'Guardar Permisos' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class RoleManagerComponent implements OnInit {
    private adminService = inject(AdminService);
    private fb = inject(FormBuilder);

    roles: Role[] = [];
    loading = false;
    saving = false;
    showModal = false;
    showPermissionsModal = false;
    editingRole: Role | null = null;
    selectedRole: Role | null = null;
    selectedPermissions: Set<string> = new Set();

    roleForm: FormGroup = this.fb.group({
        nombre: ['', Validators.required],
        descripcion: ['']
    });

    // Permission categories for the permissions editor
    permissionCategories = [
        {
            name: 'Ventas',
            permissions: [
                { code: 'pos.access', name: 'Acceso al POS' },
                { code: 'pos.discount', name: 'Aplicar Descuentos' },
                { code: 'pos.void', name: 'Anular Ventas' },
                { code: 'sales.view', name: 'Ver Historial' },
                { code: 'sales.refund', name: 'Realizar Devoluciones' },
                { code: 'cashier.close', name: 'Cierre de Caja' }
            ]
        },
        {
            name: 'Inventario',
            permissions: [
                { code: 'products.view', name: 'Ver Productos' },
                { code: 'products.create', name: 'Crear Productos' },
                { code: 'products.edit', name: 'Editar Productos' },
                { code: 'products.delete', name: 'Eliminar Productos' },
                { code: 'stock.adjust', name: 'Ajustar Stock' },
                { code: 'stock.transfer', name: 'Transferir Stock' }
            ]
        },
        {
            name: 'Configuración',
            permissions: [
                { code: 'settings.view', name: 'Ver Configuración' },
                { code: 'settings.edit', name: 'Editar Configuración' },
                { code: 'users.view', name: 'Ver Usuarios' },
                { code: 'users.manage', name: 'Gestionar Usuarios' },
                { code: 'branches.manage', name: 'Gestionar Sucursales' },
                { code: 'reports.view', name: 'Ver Reportes' }
            ]
        }
    ];

    ngOnInit() {
        this.loadRoles();
    }

    loadRoles() {
        this.loading = true;
        this.adminService.getRoles().subscribe({
            next: (data) => {
                this.roles = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading roles', err);
                this.loading = false;
            }
        });
    }

    openModal() {
        this.editingRole = null;
        this.roleForm.reset();
        this.showModal = true;
    }

    editRole(role: Role) {
        this.editingRole = role;
        this.roleForm.patchValue({
            nombre: role.nombre,
            descripcion: role.descripcion
        });
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.editingRole = null;
        this.roleForm.reset();
    }

    onSubmit() {
        if (this.roleForm.invalid) return;

        this.saving = true;
        const formData = this.roleForm.value;

        if (this.editingRole) {
            this.adminService.updateRole(this.editingRole.id, {
                nombre: formData.nombre,
                descripcion: formData.descripcion
            }).subscribe({
                next: () => {
                    this.loadRoles();
                    this.closeModal();
                    this.saving = false;
                },
                error: (err) => {
                    console.error('Error updating role', err);
                    this.saving = false;
                }
            });
        } else {
            this.adminService.createRole({
                nombre: formData.nombre,
                descripcion: formData.descripcion,
                permisos: []
            }).subscribe({
                next: () => {
                    this.loadRoles();
                    this.closeModal();
                    this.saving = false;
                },
                error: (err) => {
                    console.error('Error creating role', err);
                    this.saving = false;
                }
            });
        }
    }

    deleteRole(role: Role) {
        if (confirm(`¿Estás seguro de eliminar el rol "${role.nombre}"?`)) {
            this.adminService.deleteRole(role.id).subscribe({
                next: () => this.loadRoles(),
                error: (err) => console.error('Error deleting role', err)
            });
        }
    }

    openPermissionsEditor(role: Role) {
        this.selectedRole = role;
        this.selectedPermissions = new Set(role.permisos || []);
        this.showPermissionsModal = true;
    }

    closePermissionsModal() {
        this.showPermissionsModal = false;
        this.selectedRole = null;
        this.selectedPermissions.clear();
    }

    isPermissionSelected(code: string): boolean {
        return this.selectedPermissions.has(code);
    }

    togglePermission(code: string) {
        if (this.selectedPermissions.has(code)) {
            this.selectedPermissions.delete(code);
        } else {
            this.selectedPermissions.add(code);
        }
    }

    savePermissions() {
        if (!this.selectedRole) return;

        this.saving = true;
        const permissions = Array.from(this.selectedPermissions);

        this.adminService.updateRolePermissions(this.selectedRole.id, permissions).subscribe({
            next: () => {
                this.loadRoles();
                this.closePermissionsModal();
                this.saving = false;
            },
            error: (err) => {
                console.error('Error updating permissions', err);
                this.saving = false;
            }
        });
    }

    formatPermission(perm: string): string {
        // Convert 'pos.access' to 'POS Access'
        return perm.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
}
