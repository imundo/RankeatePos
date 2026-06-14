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
                        
                        <div class="modules-container">
                            @for (category of objectKeys(modulesByCategory); track category) {
                                <div class="category-section">
                                    <div class="category-header">
                                        <h4 class="category-title">
                                            <i [class]="getCategoryIcon(category)"></i>
                                            {{ category }}
                                        </h4>
                                        <div class="category-line"></div>
                                    </div>
                                    <div class="modules-grid">
                                        @for (module of modulesByCategory[category]; track module.code) {
                                            <div class="module-card" [class.active]="moduleStates[module.code]" (click)="toggleModule(module.code)">
                                                <div class="module-icon" [ngClass]="getCategoryColorClass(category)">{{ module.icon || '📦' }}</div>
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
                            <p-inputSwitch [formControl]="$any(infoForm.get('activo'))"></p-inputSwitch>
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
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
        }
        
        .modules-container {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        .category-section {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .category-header {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .category-title {
            margin: 0;
            font-size: 1.05rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-transform: capitalize;
        }

        .category-title i {
            color: var(--primary-color);
            font-size: 1.2rem;
        }

        .category-line {
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
        }

        .module-card {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.875rem 1rem;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            min-height: 70px;
        }
        
        .module-card:hover {
            background: rgba(255, 255, 255, 0.04);
            border-color: rgba(99, 102, 241, 0.4);
            transform: translateY(-2px);
        }
        
        .module-card.active {
            background: rgba(99, 102, 241, 0.08);
            border-color: var(--primary-color);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
        }
        
        .module-icon {
            font-size: 1.25rem;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            flex-shrink: 0;
            transition: all 0.25s ease;
        }

        .module-card.active .module-icon {
            transform: scale(1.1);
        }

        .module-icon.color-amber { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .module-icon.color-indigo { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
        .module-icon.color-emerald { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .module-icon.color-purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
        .module-icon.color-pink { background: rgba(236, 72, 153, 0.15); color: #ec4899; }
        .module-icon.color-sky { background: rgba(14, 165, 233, 0.15); color: #0ea5e9; }
        .module-icon.color-gray { background: rgba(156, 163, 175, 0.15); color: #9ca3af; }
        
        .module-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
            overflow: hidden;
        }
        
        .module-name {
            font-weight: 600;
            font-size: 0.85rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
        }
        
        .module-desc {
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.4);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
        }
        
        :host ::ng-deep .module-card .p-inputswitch {
            flex-shrink: 0;
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
    
    // For template access
    objectKeys = Object.keys;

    activeTabIndex = 0;
    loading = false;
    submitting = false;

    tenant: Tenant | null = null;
    allModules: ModuleConfig[] = [];
    modulesByCategory: Record<string, ModuleConfig[]> = {};
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

    // Default modules - aligned with database V13__create_modules_catalog.sql
    private defaultModules: ModuleConfig[] = [
        { id: 'mod-pos', code: 'pos', name: 'Punto de Venta', description: 'Ventas, caja y transacciones', icon: '🛒', category: 'Core', sortOrder: 1 },
        { id: 'mod-products', code: 'products', name: 'Catálogo', description: 'Productos, categorías y precios', icon: '📦', category: 'Core', sortOrder: 2 },
        { id: 'mod-inventory', code: 'inventory', name: 'Inventario', description: 'Stock, bodegas y movimientos', icon: '📊', category: 'Core', sortOrder: 3 },
        { id: 'mod-customers', code: 'customers', name: 'Clientes', description: 'Base de datos y CRM', icon: '👥', category: 'Growth', sortOrder: 10 },
        { id: 'mod-reservations', code: 'reservations', name: 'Reservas', description: 'Citas y disponibilidad', icon: '📅', category: 'Growth', sortOrder: 11 },
        { id: 'mod-marketing', code: 'marketing', name: 'Marketing', description: 'Campañas y fidelización', icon: '📣', category: 'Growth', sortOrder: 12 },
        { id: 'mod-reports', code: 'reports', name: 'Reportes', description: 'Analytics y exportaciones', icon: '📈', category: 'Admin', sortOrder: 20 },
        { id: 'mod-users', code: 'users', name: 'Usuarios', description: 'Gestión de equipo', icon: '👤', category: 'Admin', sortOrder: 21 },
        { id: 'mod-billing', code: 'billing', name: 'Facturación', description: 'DTE y documentos tributarios', icon: '🧾', category: 'Admin', sortOrder: 22 },
        { id: 'mod-settings', code: 'settings', name: 'Configuración', description: 'Ajustes del sistema', icon: '⚙️', category: 'Admin', sortOrder: 23 },
        { id: 'mod-integrations', code: 'integrations', name: 'Integraciones', description: 'APIs y conexiones', icon: '🔌', category: 'Admin', sortOrder: 24 }
    ];

    ngOnInit() {
        // Load modules from API with fallback to defaults
        this.adminService.getModulesFromApi().subscribe({
            next: (modules) => {
                if (modules && modules.length > 0) {
                    this.allModules = modules.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
                } else {
                    this.allModules = this.defaultModules;
                }
                this.groupModules();
            },
            error: () => {
                // Use defaults if API fails
                this.allModules = this.defaultModules;
                this.groupModules();
            }
        });
    }

    private groupModules() {
        this.modulesByCategory = {};
        this.allModules.forEach(mod => {
            const cat = mod.category || 'General';
            if (!this.modulesByCategory[cat]) {
                this.modulesByCategory[cat] = [];
            }
            this.modulesByCategory[cat].push(mod);
        });
    }

    getCategoryIcon(category: string): string {
        switch (category.toLowerCase()) {
            case 'core': return 'pi pi-star-fill';
            case 'ventas': return 'pi pi-shopping-cart';
            case 'inventario': return 'pi pi-box';
            case 'compras': return 'pi pi-truck';
            case 'operaciones': return 'pi pi-cog';
            case 'growth': return 'pi pi-chart-line';
            case 'marketing': return 'pi pi-megaphone';
            case 'finanzas': return 'pi pi-wallet';
            case 'rrhh': return 'pi pi-users';
            case 'admin': return 'pi pi-sliders-h';
            case 'configuración': return 'pi pi-wrench';
            default: return 'pi pi-folder';
        }
    }

    getCategoryColorClass(category: string): string {
        switch (category.toLowerCase()) {
            case 'core': return 'color-indigo';
            case 'ventas': return 'color-emerald';
            case 'inventario': return 'color-amber';
            case 'compras': return 'color-sky';
            case 'operaciones': return 'color-gray';
            case 'growth': return 'color-pink';
            case 'marketing': return 'color-pink';
            case 'finanzas': return 'color-purple';
            case 'rrhh': return 'color-sky';
            case 'admin': return 'color-gray';
            case 'configuración': return 'color-gray';
            default: return 'color-indigo';
        }
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
                // Normalize tenant modules for case-insensitive check
                const tenantModulesNormalized = (tenant.modules || []).map(m => m.toLowerCase());

                this.allModules.forEach(m => {
                    this.moduleStates[m.code] = tenantModulesNormalized.includes(m.code.toLowerCase());
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
