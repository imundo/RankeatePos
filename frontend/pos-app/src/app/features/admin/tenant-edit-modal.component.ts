import { Component, EventEmitter, Input, Output, OnInit, OnChanges, inject, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AdminService, Tenant, ModuleConfig, AdminUser } from '../../core/services/admin.service';

// PrimeNG Imports
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-tenant-edit-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DialogModule,
        TabViewModule,
        InputTextModule,
        DropdownModule,
        InputSwitchModule,
        ButtonModule,
        TableModule,
        TagModule,
        SkeletonModule,
        TooltipModule,
        RippleModule,
        CardModule
    ],
    template: `
    <p-dialog 
        [(visible)]="isOpen" 
        [modal]="true" 
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
        [dismissableMask]="true"
        [breakpoints]="{'960px': '90vw', '640px': '100vw'}"
        [style]="{width: '900px', maxHeight: '90vh'}"
        [contentStyle]="{'overflow': 'auto', 'padding': '0'}"
        styleClass="admin-modal"
        (onHide)="close()">
        
        <!-- Custom Header -->
        <ng-template pTemplate="header">
            <div class="modal-header">
                <div class="header-avatar" [style.background]="getAvatarGradient()">
                    {{ tenant?.nombreFantasia?.charAt(0) || tenant?.razonSocial?.charAt(0) || 'E' }}
                </div>
                <div class="header-info">
                    <h2>{{ tenant?.nombreFantasia || 'Editar Empresa' }}</h2>
                    <span class="header-rut">{{ tenant?.rut }}</span>
                </div>
            </div>
        </ng-template>

        <!-- Content with TabView -->
        <div class="modal-content">
            @if (loading) {
                <div class="loading-skeleton">
                    <p-skeleton height="2rem" styleClass="mb-3"></p-skeleton>
                    <p-skeleton height="4rem" styleClass="mb-3"></p-skeleton>
                    <p-skeleton height="4rem" styleClass="mb-3"></p-skeleton>
                    <p-skeleton height="4rem"></p-skeleton>
                </div>
            } @else {
                <p-tabView [(activeIndex)]="activeTabIndex" styleClass="admin-tabs">
                    
                    <!-- Tab: Información -->
                    <p-tabPanel>
                        <ng-template pTemplate="header">
                            <i class="pi pi-building mr-2"></i>
                            <span>Información</span>
                        </ng-template>
                        
                        <form [formGroup]="infoForm" class="form-grid">
                            <div class="form-row full">
                                <label>Razón Social</label>
                                <input pInputText formControlName="razonSocial" placeholder="Nombre legal de la empresa" />
                            </div>
                            
                            <div class="form-row">
                                <label>RUT</label>
                                <input pInputText formControlName="rut" placeholder="12.345.678-9" />
                            </div>
                            
                            <div class="form-row">
                                <label>Nombre Fantasía</label>
                                <input pInputText formControlName="nombreFantasia" placeholder="Nombre comercial" />
                            </div>
                            
                            <div class="form-row">
                                <label>Giro</label>
                                <input pInputText formControlName="giro" placeholder="Actividad comercial" />
                            </div>
                            
                            <div class="form-row">
                                <label>Tipo de Negocio</label>
                                <p-dropdown 
                                    formControlName="businessType" 
                                    [options]="businessTypes" 
                                    optionLabel="label" 
                                    optionValue="value"
                                    placeholder="Seleccionar tipo"
                                    styleClass="w-full">
                                </p-dropdown>
                            </div>
                            
                            <div class="form-section full">
                                <h4><i class="pi pi-map-marker"></i> Dirección</h4>
                            </div>
                            
                            <div class="form-row full">
                                <label>Dirección</label>
                                <input pInputText formControlName="direccion" placeholder="Calle, número" />
                            </div>
                            
                            <div class="form-row">
                                <label>Comuna</label>
                                <input pInputText formControlName="comuna" />
                            </div>
                            
                            <div class="form-row">
                                <label>Región</label>
                                <input pInputText formControlName="region" />
                            </div>
                        </form>
                    </p-tabPanel>
                    
                    <!-- Tab: Módulos -->
                    <p-tabPanel>
                        <ng-template pTemplate="header">
                            <i class="pi pi-th-large mr-2"></i>
                            <span>Módulos</span>
                            <p-tag [value]="activeModulesCount + ''" severity="info" styleClass="ml-2"></p-tag>
                        </ng-template>
                        
                        <div class="modules-header">
                            <span class="modules-subtitle">Activa o desactiva los módulos disponibles para esta empresa</span>
                        </div>
                        
                        <div class="modules-grid">
                            @for (module of allModules; track module.code) {
                                <div class="module-card" [class.active]="moduleStates[module.code]" (click)="toggleModule(module.code)">
                                    <div class="module-icon">{{ module.icon || '📦' }}</div>
                                    <div class="module-info">
                                        <span class="module-name">{{ module.name }}</span>
                                        <span class="module-desc">{{ module.description }}</span>
                                    </div>
                                    <p-inputSwitch 
                                        [(ngModel)]="moduleStates[module.code]" 
                                        (click)="$event.stopPropagation()">
                                    </p-inputSwitch>
                                </div>
                            }
                        </div>
                    </p-tabPanel>
                    
                    <!-- Tab: Usuarios -->
                    <p-tabPanel>
                        <ng-template pTemplate="header">
                            <i class="pi pi-users mr-2"></i>
                            <span>Usuarios</span>
                        </ng-template>
                        
                        <p-table [value]="tenantUsers" [tableStyle]="{'min-width': '100%'}" styleClass="p-datatable-sm admin-table">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Usuario</th>
                                    <th>Email</th>
                                    <th>Estado</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-user>
                                <tr>
                                    <td>
                                        <div class="user-cell">
                                            <div class="user-avatar">{{ user.nombre?.charAt(0) || 'U' }}</div>
                                            <span>{{ user.nombre }} {{ user.apellido }}</span>
                                        </div>
                                    </td>
                                    <td>{{ user.email }}</td>
                                    <td>
                                        <p-tag [value]="user.activo ? 'Activo' : 'Inactivo'" 
                                               [severity]="user.activo ? 'success' : 'danger'">
                                        </p-tag>
                                    </td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="emptymessage">
                                <tr>
                                    <td colspan="3" class="empty-message">
                                        <i class="pi pi-users"></i>
                                        <span>No hay usuarios registrados</span>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabPanel>
                    
                    <!-- Tab: Plan & Estado -->
                    <p-tabPanel>
                        <ng-template pTemplate="header">
                            <i class="pi pi-cog mr-2"></i>
                            <span>Plan & Estado</span>
                        </ng-template>
                        
                        <div class="plan-section">
                            <h4>Plan de Suscripción</h4>
                            <div class="plans-grid">
                                @for (plan of plans; track plan.code) {
                                    <div class="plan-card" 
                                         [class.selected]="infoForm.get('plan')?.value === plan.code"
                                         (click)="infoForm.get('plan')?.setValue(plan.code)">
                                        <div class="plan-name">{{ plan.name }}</div>
                                        <div class="plan-price">{{ plan.price | currency:'CLP':'symbol-narrow':'1.0-0' }}</div>
                                    </div>
                                }
                            </div>
                        </div>
                        
                        <div class="status-section" [class.active]="infoForm.get('activo')?.value">
                            <div class="status-info">
                                <h4>Estado del Tenant</h4>
                                <p>{{ infoForm.get('activo')?.value ? 'Empresa operativa - usuarios pueden ingresar' : 'Empresa suspendida - acceso bloqueado' }}</p>
                            </div>
                            <p-inputSwitch formControlName="activo" [formGroup]="infoForm"></p-inputSwitch>
                        </div>
                    </p-tabPanel>
                    
                </p-tabView>
            }
        </div>

        <!-- Footer -->
        <ng-template pTemplate="footer">
            <div class="modal-footer">
                <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="close()"></p-button>
                <p-button 
                    label="Guardar Cambios" 
                    icon="pi pi-check" 
                    [loading]="submitting"
                    [disabled]="loading || submitting"
                    (onClick)="save()">
                </p-button>
            </div>
        </ng-template>
        
    </p-dialog>
    `,
    styles: [`
        /* Host Styles */
        :host {
            display: block;
        }
        
        /* Modal Header */
        .modal-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            width: 100%;
        }
        
        .header-avatar {
            width: 52px;
            height: 52px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            font-weight: 700;
            color: white;
            flex-shrink: 0;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        
        .header-info {
            flex: 1;
        }
        
        .header-info h2 {
            margin: 0 0 0.25rem;
            font-size: 1.35rem;
            font-weight: 600;
            color: white;
        }
        
        .header-rut {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.5);
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
            background: rgba(255, 255, 255, 0.05);
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
        }
        
        /* Modal Content */
        .modal-content {
            padding: 0;
            min-height: 450px;
        }
        
        .loading-skeleton {
            padding: 2rem;
        }
        
        /* PrimeNG Deep Overrides */
        :host ::ng-deep {
            .p-tabview .p-tabview-panels {
                padding: 1.5rem;
            }
            
            .p-inputtext {
                width: 100%;
            }
            
            .p-dropdown {
                width: 100%;
            }
            
            .p-datatable .p-datatable-tbody > tr > td {
                padding: 0.875rem 1rem;
            }
            
            .p-tag {
                font-size: 0.7rem;
            }
        }
        
        /* Form Grid */
        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
        }
        
        .form-row {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
        }
        
        .form-row.full {
            grid-column: 1 / -1;
        }
        
        .form-row label {
            font-size: 0.85rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.6);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .form-section {
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            grid-column: 1 / -1;
        }
        
        .form-section h4 {
            margin: 0 0 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            color: var(--primary-color);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        /* Modules Grid */
        .modules-header {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .modules-subtitle {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.9rem;
        }
        
        .modules-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 0.875rem;
        }
        
        .module-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.25rem;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .module-card:hover {
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(99, 102, 241, 0.4);
            transform: translateY(-2px);
        }
        
        .module-card.active {
            background: rgba(99, 102, 241, 0.1);
            border-color: var(--primary-color);
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
        }
        
        .module-icon {
            font-size: 1.5rem;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            flex-shrink: 0;
        }
        
        .module-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        
        .module-name {
            font-weight: 600;
            font-size: 0.95rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .module-desc {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.45);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        /* Users Table */
        .user-cell {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .user-avatar {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
            font-weight: 600;
            color: white;
            flex-shrink: 0;
        }
        
        .empty-message {
            text-align: center;
            padding: 3rem !important;
            color: rgba(255, 255, 255, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
        }
        
        .empty-message i {
            font-size: 2.5rem;
            opacity: 0.4;
        }
        
        /* Plans Section */
        .plan-section {
            margin-bottom: 2rem;
        }
        
        .plan-section h4 {
            margin: 0 0 1rem;
            font-weight: 600;
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .plans-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 0.75rem;
        }
        
        .plan-card {
            padding: 1.25rem 1rem;
            background: rgba(255, 255, 255, 0.02);
            border: 2px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            text-align: center;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .plan-card:hover {
            border-color: rgba(99, 102, 241, 0.5);
            background: rgba(99, 102, 241, 0.05);
        }
        
        .plan-card.selected {
            border-color: var(--primary-color);
            background: rgba(99, 102, 241, 0.15);
            box-shadow: 0 0 30px rgba(99, 102, 241, 0.25);
            transform: scale(1.02);
        }
        
        .plan-name {
            font-weight: 600;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .plan-price {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--primary-color);
        }
        
        /* Status Section */
        .status-section {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            transition: all 0.3s ease;
        }
        
        .status-section.active {
            border-color: rgba(16, 185, 129, 0.5);
            background: rgba(16, 185, 129, 0.08);
        }
        
        .status-info h4 {
            margin: 0 0 0.35rem;
            font-size: 1rem;
            font-weight: 600;
        }
        
        .status-info p {
            margin: 0;
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.5);
        }
        
        /* Modal Footer */
        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            width: 100%;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
                gap: 1.25rem;
            }
            
            .modules-grid {
                grid-template-columns: 1fr;
            }
            
            .plans-grid {
                grid-template-columns: repeat(3, 1fr);
            }
            
            .status-section {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
            
            .modal-footer {
                flex-direction: column-reverse;
            }
            
            .modal-footer > * {
                width: 100%;
            }
        }
        
        @media (max-width: 480px) {
            .plans-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .header-info h2 {
                font-size: 1.1rem;
            }
        }
    `]
})
export class TenantEditModalComponent implements OnInit, OnChanges {
    @Input() tenantId: string | null = null;
    @Input() isOpen = false;
    @Output() closeEvent = new EventEmitter<void>();
    @Output() saveEvent = new EventEmitter<void>();

    private fb = inject(FormBuilder);
    private adminService = inject(AdminService);

    activeTabIndex = 0;
    loading = false;
    submitting = false;

    tenant: Tenant | null = null;
    allModules: ModuleConfig[] = [];
    moduleStates: Record<string, boolean> = {};
    tenantUsers: AdminUser[] = [];

    businessTypes = [
        { label: 'Retail', value: 'RETAIL' },
        { label: 'Restaurante', value: 'RESTAURANT' },
        { label: 'Panadería', value: 'PANADERIA' },
        { label: 'Minimarket', value: 'MINIMARKET' },
        { label: 'Barbería', value: 'BARBERIA' },
        { label: 'Servicios', value: 'SERVICIOS' },
        { label: 'Otro', value: 'OTRO' }
    ];

    plans = [
        { code: 'FREE', name: 'Gratis', price: 0 },
        { code: 'BASIC', name: 'Básico', price: 25000 },
        { code: 'PRO', name: 'Pro', price: 45000 },
        { code: 'BUSINESS', name: 'Business', price: 80000 },
        { code: 'ENTERPRISE', name: 'Enterprise', price: 150000 }
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

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isOpen'] && this.isOpen && this.tenantId) {
            this.loadTenantData();
        }
    }

    loadTenantData() {
        if (!this.tenantId) return;
        this.loading = true;
        this.activeTabIndex = 0;

        this.adminService.getTenant(this.tenantId).subscribe({
            next: (tenant) => {
                this.tenant = tenant;
                this.infoForm.patchValue({
                    razonSocial: tenant.razonSocial,
                    rut: tenant.rut,
                    nombreFantasia: tenant.nombreFantasia,
                    giro: '',
                    direccion: '',
                    comuna: '',
                    region: '',
                    businessType: tenant.businessType,
                    activo: tenant.activo,
                    plan: tenant.plan
                });

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

    getAvatarGradient(): string {
        const gradients = [
            'linear-gradient(135deg, #6366f1, #8b5cf6)',
            'linear-gradient(135deg, #f59e0b, #d97706)',
            'linear-gradient(135deg, #10b981, #059669)',
            'linear-gradient(135deg, #ef4444, #dc2626)',
            'linear-gradient(135deg, #3b82f6, #1d4ed8)'
        ];
        const index = (this.tenant?.razonSocial?.charCodeAt(0) || 0) % gradients.length;
        return gradients[index];
    }

    save() {
        if (this.infoForm.invalid || !this.tenantId) return;

        this.submitting = true;
        const formValues = this.infoForm.value;

        const updateDetails$ = this.adminService.updateTenant(this.tenantId, {
            razonSocial: formValues.razonSocial,
            nombreFantasia: formValues.nombreFantasia,
            businessType: formValues.businessType,
            plan: formValues.plan,
            rut: formValues.rut
        });

        const updateModules$ = this.adminService.updateTenantModules(this.tenantId, this.moduleStates);
        const updateStatus$ = this.adminService.updateTenantStatus(this.tenantId, formValues.activo);

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
    }

    close() {
        this.closeEvent.emit();
    }
}
