import { Component, EventEmitter, Input, Output, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AdminService, Tenant, ModuleConfig, AdminUser } from '../../core/services/admin.service';

@Component({
    selector: 'app-tenant-edit-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" *ngIf="isOpen">
      <div class="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-indigo-500/20">
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-indigo-500/20 bg-slate-900/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xl">
              {{ tenant?.nombreFantasia?.charAt(0) || tenant?.razonSocial?.charAt(0) || 'E' }}
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">{{ tenant?.nombreFantasia || 'Editar Empresa' }}</h2>
              <p class="text-sm text-indigo-300 font-mono">{{ tenant?.rut }}</p>
            </div>
          </div>
          <button (click)="close()" class="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- content -->
        <div class="flex flex-1 overflow-hidden">
          
          <!-- Sidebar / Tabs -->
          <div class="w-64 bg-slate-800/30 border-r border-indigo-500/10 flex flex-col p-4 gap-2">
            <button 
              *ngFor="let tab of tabs" 
              (click)="activeTab = tab.id"
              class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
              [ngClass]="activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:bg-white/5 hover:text-white'">
              <span class="text-xl">{{ tab.icon }}</span>
              <span class="font-medium">{{ tab.label }}</span>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="flex-1 overflow-y-auto p-6 bg-slate-900 custom-scrollbar">
            
            <!-- Loading State -->
            <div *ngIf="loading" class="flex items-center justify-center h-full">
              <div class="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>

            <ng-container *ngIf="!loading">
              
              <!-- Tab: General Info -->
              <div *ngIf="activeTab === 'info'" [formGroup]="infoForm" class="space-y-6">
                <div class="grid grid-cols-2 gap-6">
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-slate-400 mb-2">Razón Social</label>
                    <input type="text" formControlName="razonSocial" class="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-400 mb-2">RUT</label>
                    <input type="text" formControlName="rut" class="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-400 mb-2">Nombre Fantasía</label>
                    <input type="text" formControlName="nombreFantasia" class="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-400 mb-2">Giro</label>
                    <input type="text" formControlName="giro" class="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-400 mb-2">Tipo Negocio</label>
                    <select formControlName="businessType" class="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors appearance-none">
                      <option value="RETAIL">Retail</option>
                      <option value="RESTAURANT">Restaurante</option>
                      <option value="PANADERIA">Panadería</option>
                      <option value="MINIMARKET">Minimarket</option>
                      <option value="BARBERIA">Barbería</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>

                <div class="pt-4 border-t border-indigo-500/10">
                   <h3 class="text-lg font-semibold text-white mb-4">Dirección</h3>
                   <div class="grid grid-cols-2 gap-6">
                      <div class="col-span-2">
                        <label class="block text-sm font-medium text-slate-400 mb-2">Dirección</label>
                        <input type="text" formControlName="direccion" class="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-400 mb-2">Comuna</label>
                        <input type="text" formControlName="comuna" class="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-400 mb-2">Región</label>
                        <input type="text" formControlName="region" class="w-full bg-slate-800 border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none border transition-colors">
                      </div>
                   </div>
                </div>
              </div>

              <!-- Tab: Modules -->
              <div *ngIf="activeTab === 'modules'" class="space-y-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold text-white">Módulos Activos</h3>
                  <span class="text-sm text-slate-400">{{ activeModulesCount }} habilitados</span>
                </div>

                <div class="grid grid-cols-1 gap-4">
                  <div *ngFor="let module of allModules" 
                       class="flex items-center justify-between p-4 rounded-xl border border-slate-800 transition-all cursor-pointer group hover:border-indigo-500/50"
                       [ngClass]="moduleStates[module.code] ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/50'">
                    
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                           [ngClass]="moduleStates[module.code] ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'">
                        {{ module.icon || '📦' }}
                      </div>
                      <div>
                        <h4 class="font-medium text-white group-hover:text-indigo-300 transition-colors">{{ module.name }}</h4>
                        <p class="text-sm text-slate-500">{{ module.description }}</p>
                      </div>
                    </div>

                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" 
                             [checked]="moduleStates[module.code]" 
                             (change)="toggleModule(module.code)"
                             class="sr-only peer">
                      <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Tab: Users -->
              <div *ngIf="activeTab === 'users'" class="space-y-6">
                 <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-white">Usuarios Administradores</h3>
                    <!-- TODO: Add generic create user modal support -->
                    <!-- <button class="btn-secondary text-sm">Validar</button> -->
                 </div>

                 <div class="bg-slate-800/50 rounded-xl border border-slate-800 overflow-hidden">
                    <table class="w-full text-left">
                       <thead class="bg-slate-800 text-xs uppercase text-slate-400">
                          <tr>
                             <th class="px-4 py-3">Nombre</th>
                             <th class="px-4 py-3">Email</th>
                             <th class="px-4 py-3">Estado</th>
                          </tr>
                       </thead>
                       <tbody class="divide-y divide-slate-800">
                          <tr *ngFor="let user of tenantUsers">
                             <td class="px-4 py-3 text-white font-medium">{{ user.nombre }} {{ user.apellido }}</td>
                             <td class="px-4 py-3 text-slate-400">{{ user.email }}</td>
                             <td class="px-4 py-3">
                                <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                                      [ngClass]="user.activo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
                                   {{ user.activo ? 'Activo' : 'Inactivo' }}
                                </span>
                             </td>
                          </tr>
                          <tr *ngIf="tenantUsers.length === 0">
                             <td colspan="3" class="px-4 py-8 text-center text-slate-500">
                                No se encontraron usuarios para este tenant.
                             </td>
                          </tr>
                       </tbody>
                    </table>
                 </div>
              </div>

              <!-- Tab: Status/Plan -->
              <div *ngIf="activeTab === 'status'" [formGroup]="infoForm" class="space-y-6">
                 <div class="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <h3 class="text-lg font-semibold text-purple-200 mb-2">Plan de Suscripción</h3>
                    <div class="flex gap-4 mt-4">
                       <div *ngFor="let plan of plans" 
                            class="flex-1 p-4 rounded-lg border cursor-pointer transition-all"
                            [ngClass]="infoForm.get('plan')?.value === plan.code ? 'bg-purple-600/20 border-purple-500 shadow-lg' : 'bg-slate-800 border-slate-700 opacity-60 hover:opacity-100'"
                            (click)="infoForm.get('plan')?.setValue(plan.code)">
                          <div class="text-center">
                             <h4 class="font-bold text-white">{{ plan.name }}</h4>
                             <p class="text-sm text-purple-300">{{ plan.price | currency:'CLP' }}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div class="p-6 rounded-xl border border-slate-800"
                      [ngClass]="tenant?.activo ? 'bg-green-500/5' : 'bg-red-500/5'">
                    <div class="flex items-center justify-between">
                       <div>
                          <h3 class="text-lg font-semibold text-white mb-1">Estado del Tenant</h3>
                          <p class="text-sm text-slate-400">
                             {{ tenant?.activo ? 'La empresa está operativa y los usuarios pueden ingresar.' : 'La empresa está suspendida y nadie puede ingresar.' }}
                          </p>
                       </div>
                       <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" formControlName="activo" class="sr-only peer">
                          <div class="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                       </label>
                    </div>
                 </div>
              </div>

            </ng-container>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-indigo-500/10 bg-slate-900/50 flex justify-end gap-3">
          <button (click)="close()" class="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium">
            Cancelar
          </button>
          <button (click)="save()" 
                  [disabled]="loading || submitting"
                  class="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <span *ngIf="submitting" class="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
            {{ submitting ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `]
})
export class TenantEditModalComponent implements OnInit {
    @Input() tenantId: string | null = null;
    @Input() isOpen = false;
    @Output() closeEvent = new EventEmitter<void>();
    @Output() saveEvent = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private adminService = inject(AdminService);

    activeTab = 'info';
    loading = false;
    submitting = false;

    tenant: Tenant | null = null;
    allModules: ModuleConfig[] = [];
    moduleStates: Record<string, boolean> = {};
    tenantUsers: AdminUser[] = [];

    // TODO: Fetch from API or use constants
    plans = [
        { code: 'FREE', name: 'Gratis', price: 0 },
        { code: 'BASIC', name: 'Básico', price: 25000 },
        { code: 'PRO', name: 'Pro', price: 45000 },
        { code: 'BUSINESS', name: 'Business', price: 80000 },
        { code: 'ENTERPRISE', name: 'Enterprise', price: 150000 }
    ];

    tabs = [
        { id: 'info', label: 'Información', icon: '🏢' },
        { id: 'modules', label: 'Módulos', icon: '🧩' },
        { id: 'users', label: 'Usuarios', icon: '👥' },
        { id: 'status', label: 'Estado & Plan', icon: '⚙️' }
    ];

    infoForm: FormGroup = this.fb.group({
        razonSocial: ['', Validators.required],
        rut: ['', Validators.required],
        nombreFantasia: [''],
        giro: [''],
        direccion: [''],
        comuna: [''],
        region: [''],
        businessType: ['OTRO'],
        activo: [true],
        plan: ['FREE']
    });

    ngOnInit() {
        this.adminService.getModulesFromApi().subscribe(modules => {
            this.allModules = modules.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
        });
    }

    ngOnChanges() {
        if (this.isOpen && this.tenantId) {
            this.loadTenantData();
        }
    }

    loadTenantData() {
        if (!this.tenantId) return;
        this.loading = true;

        // Load Tenant Details
        this.adminService.getTenant(this.tenantId).subscribe({
            next: (tenant) => {
                this.tenant = tenant;
                this.infoForm.patchValue({
                    razonSocial: tenant.razonSocial,
                    rut: tenant.rut,
                    nombreFantasia: tenant.nombreFantasia,
                    giro: '', // Not in basic tenant interface immediately available, might need extension
                    direccion: '',
                    comuna: '',
                    region: '',
                    businessType: tenant.businessType,
                    activo: tenant.activo,
                    plan: tenant.plan
                });

                // Initialize modules state based on tenant.modules (array of codes)
                this.moduleStates = {};
                this.allModules.forEach(m => {
                    this.moduleStates[m.code] = tenant.modules ? tenant.modules.includes(m.code) : false;
                });

                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading tenant', err);
                this.loading = false;
            }
        });

        // Load Tenant Users (async/parallel)
        this.adminService.getTenantUsers(this.tenantId).subscribe({
            next: (users) => this.tenantUsers = users,
            error: (err) => console.error('Error loading users', err)
        });
    }

    toggleModule(code: string) {
        this.moduleStates[code] = !this.moduleStates[code];
    }

    get activeModulesCount(): number {
        return Object.values(this.moduleStates).filter(v => v).length;
    }

    save() {
        if (this.infoForm.invalid || !this.tenantId) return;

        this.submitting = true;
        const formValues = this.infoForm.value;

        // 1. Update Details
        const updateDetails$ = this.adminService.updateTenant(this.tenantId, {
            razonSocial: formValues.razonSocial,
            nombreFantasia: formValues.nombreFantasia,
            businessType: formValues.businessType,
            plan: formValues.plan,
            rut: formValues.rut
            // Add other fields if DTO supports them
        });

        // 2. Update Modules
        const updateModules$ = this.adminService.updateTenantModules(this.tenantId, this.moduleStates);

        // 3. Update Status (if changed)
        const updateStatus$ = this.adminService.updateTenantStatus(this.tenantId, formValues.activo);

        // Execute sequentially or parallel? Native forkJoin is better but let's simple chain for safe execution flow
        updateDetails$.subscribe({
            next: () => {
                updateModules$.subscribe({
                    next: () => {
                        if (this.tenant?.activo !== formValues.activo) {
                            updateStatus$.subscribe({
                                next: () => this.finishSave(),
                                error: (e) => this.handleError(e)
                            });
                        } else {
                            this.finishSave();
                        }
                    },
                    error: (e) => this.handleError(e)
                });
            },
            error: (e) => this.handleError(e)
        });
    }

    finishSave() {
        this.submitting = false;
        this.saveEvent.emit();
        this.close();
    }

    handleError(err: any) {
        console.error('Error updating tenant', err);
        this.submitting = false;
        // Show toast/alert?
    }

    close() {
        this.closeEvent.emit();
    }
}
