import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, Tenant, ModuleConfig } from '../../core/services/admin.service';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { AccordionModule } from 'primeng/accordion';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

interface TenantModules {
    tenant: Tenant;
    modules: Record<string, boolean>;
    saving?: boolean;
}

@Component({
    selector: 'app-modules-catalog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        CardModule,
        InputTextModule,
        InputSwitchModule,
        ButtonModule,
        TagModule,
        ToastModule,
        SkeletonModule,
        TooltipModule,
        RippleModule,
        AccordionModule,
        BadgeModule,
        ProgressBarModule,
        IconFieldModule,
        InputIconModule,
        DialogModule,
        DropdownModule,
        InputNumberModule,
        InputTextareaModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
    <p-toast position="top-right"></p-toast>
    
    <p-confirmDialog></p-confirmDialog>
    <div class="modules-page">
        <!-- Header -->
        <header class="page-header">
            <div class="header-left">
                <a routerLink="/admin/dashboard" class="back-link">
                    <i class="pi pi-arrow-left"></i>
                    Dashboard
                </a>
                <h1>
                    <i class="pi pi-th-large"></i>
                    Gestión de Módulos
                </h1>
                <p class="subtitle">Control de acceso a funcionalidades por empresa</p>
            </div>
            <div class="header-actions">
                <p-button label="Nuevo Módulo" icon="pi pi-plus" (onClick)="openNewModuleDialog()" severity="success"></p-button>
            </div>
        </header>

        <!-- Stats Row -->
        <div class="stats-row">
            <div class="stat-card">
                <div class="stat-icon"><i class="pi pi-building"></i></div>
                <div class="stat-content">
                    <span class="stat-value">{{ tenantsData().length }}</span>
                    <span class="stat-label">Empresas</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="pi pi-th-large"></i></div>
                <div class="stat-content">
                    <span class="stat-value">{{ allModules().length }}</span>
                    <span class="stat-label">Módulos</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon active-icon"><i class="pi pi-check-circle"></i></div>
                <div class="stat-content">
                    <span class="stat-value">{{ activeModuleCount() }}</span>
                    <span class="stat-label">Activos</span>
                </div>
            </div>
        </div>

        <!-- Tabs: Catalog | Per-Tenant -->
        <div class="view-tabs">
            <button class="tab-btn" [class.active]="activeTab() === 'catalog'" (click)="activeTab.set('catalog')">
                <i class="pi pi-list"></i> Catálogo de Módulos
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'tenants'" (click)="activeTab.set('tenants')">
                <i class="pi pi-building"></i> Asignación por Empresa
            </button>
        </div>

        <!-- ========== TAB: Module Catalog ========== -->
        @if (activeTab() === 'catalog') {
            @if (loadingModules()) {
                <div class="skeleton-list">
                    @for (i of [1,2,3]; track i) {
                        <div class="skeleton-card">
                            <div class="skeleton-header">
                                <p-skeleton shape="circle" size="3rem"></p-skeleton>
                                <div class="skeleton-text">
                                    <p-skeleton width="60%" height="1.2rem"></p-skeleton>
                                    <p-skeleton width="40%" height="0.8rem" styleClass="mt-2"></p-skeleton>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            } @else {
                <div class="catalog-grid">
                    @for (module of allModules(); track module.id) {
                        <div class="catalog-card" [class.inactive]="!module.active">
                            <div class="catalog-header">
                                <span class="catalog-icon">{{ module.icon }}</span>
                                <div class="catalog-info">
                                    <span class="catalog-name">{{ module.name }}</span>
                                    <span class="catalog-code">{{ module.code }}</span>
                                </div>
                                <p-tag [value]="module.active ? 'Activo' : 'Inactivo'" [severity]="module.active ? 'success' : 'danger'" styleClass="status-tag"></p-tag>
                            </div>
                            <p class="catalog-desc">{{ module.description || 'Sin descripción' }}</p>
                            <div class="catalog-meta">
                                <p-tag [value]="module.category || 'General'" severity="info" styleClass="category-tag"></p-tag>
                                <span class="sort-order">Orden: {{ module.sortOrder }}</span>
                            </div>
                            <div class="catalog-actions">
                                <p-button icon="pi pi-pencil" [text]="true" severity="info" pTooltip="Editar" (onClick)="editModule(module)"></p-button>
                                <p-button icon="pi pi-trash" [text]="true" severity="danger" pTooltip="Eliminar" (onClick)="confirmDeleteModule(module)"></p-button>
                            </div>
                        </div>
                    }
                </div>
            }
        }

        <!-- ========== TAB: Per-Tenant Module Assignment ========== -->
        @if (activeTab() === 'tenants') {

        <!-- Module Legend -->
        <div class="modules-legend">
            <span class="legend-title">Módulos disponibles:</span>
            <div class="legend-items">
                @for (module of allModules(); track module.code) {
                    <div class="legend-chip" [pTooltip]="module.description" tooltipPosition="top">
                        <span class="chip-icon">{{ module.icon }}</span>
                        <span class="chip-name">{{ module.name }}</span>
                    </div>
                }
            </div>
        </div>

        <!-- Search -->
        <div class="search-section">
            <p-iconField iconPosition="left">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input 
                    pInputText 
                    type="text" 
                    [(ngModel)]="searchTerm"
                    placeholder="Buscar empresa..." />
            </p-iconField>
        </div>

        <!-- Tenants List -->
        @if (loading()) {
            <div class="skeleton-list">
                @for (i of [1,2,3,4]; track i) {
                    <div class="skeleton-card">
                        <div class="skeleton-header">
                            <p-skeleton shape="circle" size="3rem"></p-skeleton>
                            <div class="skeleton-text">
                                <p-skeleton width="60%" height="1.2rem"></p-skeleton>
                                <p-skeleton width="40%" height="0.8rem" styleClass="mt-2"></p-skeleton>
                            </div>
                        </div>
                    </div>
                }
            </div>
        } @else {
            <p-accordion [multiple]="true" styleClass="tenant-accordion">
                @for (item of filteredTenants(); track item.tenant.id; let i = $index) {
                    <p-accordionTab>
                        <ng-template pTemplate="header">
                            <div class="accordion-header">
                                <div class="tenant-avatar" [style.background]="getAvatarColor(item.tenant.businessType)">
                                    {{ item.tenant.razonSocial?.charAt(0) || 'T' }}
                                </div>
                                <div class="tenant-info">
                                    <span class="tenant-name">{{ item.tenant.razonSocial }}</span>
                                    <div class="tenant-meta">
                                        <p-tag [value]="item.tenant.plan" [severity]="getPlanSeverity(item.tenant.plan)" styleClass="plan-tag"></p-tag>
                                        <p-tag [value]="item.tenant.businessType" severity="secondary"></p-tag>
                                    </div>
                                </div>
                                <div class="module-progress">
                                    <span class="progress-label">{{ getActiveModuleCount(item) }}/{{ allModules().length }}</span>
                                    <p-progressBar 
                                        [value]="(getActiveModuleCount(item) / allModules().length) * 100" 
                                        [showValue]="false"
                                        styleClass="progress-mini">
                                    </p-progressBar>
                                </div>
                            </div>
                        </ng-template>
                        
                        <div class="modules-content">
                            <div class="modules-grid">
                                @for (module of allModules(); track module.code) {
                                    <div class="module-card" 
                                         [class.active]="item.modules[module.code]"
                                         (click)="toggleModule(item, module.code)">
                                        <div class="module-icon">{{ module.icon }}</div>
                                        <div class="module-details">
                                            <span class="module-name">{{ module.name }}</span>
                                            <span class="module-desc">{{ module.description }}</span>
                                        </div>
                                        <p-inputSwitch 
                                            [(ngModel)]="item.modules[module.code]"
                                            (click)="$event.stopPropagation()">
                                        </p-inputSwitch>
                                    </div>
                                }
                            </div>
                            
                            <div class="actions-bar">
                                <div class="quick-actions">
                                    <p-button 
                                        label="Activar todos" 
                                        icon="pi pi-check-circle" 
                                        severity="success"
                                        [text]="true"
                                        (onClick)="enableAll(item)">
                                    </p-button>
                                    <p-button 
                                        label="Desactivar todos" 
                                        icon="pi pi-times-circle" 
                                        severity="danger"
                                        [text]="true"
                                        (onClick)="disableAll(item)">
                                    </p-button>
                                </div>
                                <p-button 
                                    label="Guardar Cambios" 
                                    icon="pi pi-save" 
                                    [loading]="item.saving"
                                    (onClick)="saveModules(item)">
                                </p-button>
                            </div>
                        </div>
                    </p-accordionTab>
                }
            </p-accordion>
            
            @if (filteredTenants().length === 0) {
                <div class="empty-state">
                    <i class="pi pi-search"></i>
                    <h3>No se encontraron empresas</h3>
                    <p>Intenta con otro término de búsqueda</p>
                </div>
            }
        }
        } <!-- end tenants tab if -->
    </div>

    <!-- ========== Module Create/Edit Dialog ========== -->
    <p-dialog
        [(visible)]="showModuleDialog"
        [header]="editingModule() ? 'Editar Módulo' : 'Nuevo Módulo'"
        [modal]="true"
        [style]="{width: '500px'}"
        [closable]="true"
        styleClass="module-dialog">
        <div class="dialog-form">
            <div class="form-row">
                <label>Código</label>
                <input pInputText [(ngModel)]="moduleForm.code" placeholder="ej: reservations" [disabled]="!!editingModule()" />
            </div>
            <div class="form-row">
                <label>Nombre</label>
                <input pInputText [(ngModel)]="moduleForm.name" placeholder="ej: Reservaciones" />
            </div>
            <div class="form-row">
                <label>Descripción</label>
                <textarea pTextarea [(ngModel)]="moduleForm.description" rows="2" placeholder="Descripción breve del módulo"></textarea>
            </div>
            <div class="form-row-half">
                <div class="form-field">
                    <label>Icono (emoji)</label>
                    <input pInputText [(ngModel)]="moduleForm.icon" placeholder="📅" style="width:80px" />
                </div>
                <div class="form-field">
                    <label>Categoría</label>
                    <input pInputText [(ngModel)]="moduleForm.category" placeholder="Operaciones" />
                </div>
            </div>
            <div class="form-row-half">
                <div class="form-field">
                    <label>Orden</label>
                    <p-inputNumber [(ngModel)]="moduleForm.sortOrder" [min]="0" [max]="99"></p-inputNumber>
                </div>
                <div class="form-field">
                    <label>Activo</label>
                    <p-inputSwitch [(ngModel)]="moduleForm.active"></p-inputSwitch>
                </div>
            </div>
        </div>
        <ng-template pTemplate="footer">
            <p-button label="Cancelar" icon="pi pi-times" [text]="true" (onClick)="showModuleDialog = false"></p-button>
            <p-button label="Guardar" icon="pi pi-check" [loading]="savingModule()" (onClick)="saveModule()"></p-button>
        </ng-template>
    </p-dialog>
    `,
    styles: [`
        .modules-page {
            min-height: 100vh;
            background: var(--surface-ground);
            padding: 1.5rem;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .header-left { display: flex; flex-direction: column; gap: 0.5rem; }
        .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text-color-secondary); text-decoration: none; font-size: 0.875rem; transition: color 0.2s; }
        .back-link:hover { color: var(--primary-color); }
        h1 { margin: 0; font-size: 1.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.75rem; }
        h1 i { color: var(--primary-color); }
        .subtitle { margin: 0; color: var(--text-color-secondary); }

        /* Stats Row */
        .stats-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .stat-card { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: 12px; flex: 1; min-width: 140px; }
        .stat-icon { width: 40px; height: 40px; border-radius: 10px; background: color-mix(in srgb, var(--primary-color) 15%, transparent); display: flex; align-items: center; justify-content: center; color: var(--primary-color); }
        .stat-icon.active-icon { background: color-mix(in srgb, var(--green-500) 15%, transparent); color: var(--green-500); }
        .stat-content { display: flex; flex-direction: column; }
        .stat-value { font-size: 1.5rem; font-weight: 700; }
        .stat-label { font-size: 0.75rem; color: var(--text-color-secondary); }

        /* Tabs */
        .view-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: 12px; padding: 0.375rem; }
        .tab-btn { border: none; background: none; padding: 0.75rem 1.25rem; border-radius: 8px; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: var(--text-color-secondary); transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
        .tab-btn.active { background: var(--primary-color); color: white; }
        .tab-btn:hover:not(.active) { background: var(--surface-100); }

        /* Catalog Grid */
        .catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
        .catalog-card { background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: 12px; padding: 1.25rem; transition: all 0.25s ease; position: relative; }
        .catalog-card:hover { border-color: var(--primary-400); box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .catalog-card.inactive { opacity: 0.6; }
        .catalog-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
        .catalog-icon { font-size: 1.75rem; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--surface-100); border-radius: 12px; flex-shrink: 0; }
        .catalog-info { flex: 1; min-width: 0; }
        .catalog-name { font-weight: 600; font-size: 1rem; display: block; }
        .catalog-code { font-size: 0.75rem; color: var(--text-color-secondary); font-family: monospace; }
        .catalog-desc { font-size: 0.85rem; color: var(--text-color-secondary); margin: 0 0 0.75rem; line-height: 1.4; }
        .catalog-meta { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
        .sort-order { font-size: 0.75rem; color: var(--text-color-secondary); }
        .catalog-actions { display: flex; gap: 0.25rem; justify-content: flex-end; border-top: 1px solid var(--surface-border); padding-top: 0.75rem; margin-top: 0.5rem; }

        /* Dialog Form */
        .dialog-form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: flex; flex-direction: column; gap: 0.375rem; }
        .form-row label { font-weight: 500; font-size: 0.875rem; }
        .form-row input, .form-row textarea { width: 100%; }
        .form-row-half { display: flex; gap: 1rem; }
        .form-field { display: flex; flex-direction: column; gap: 0.375rem; flex: 1; }
        .form-field label { font-weight: 500; font-size: 0.875rem; }

        /* Module Legend & Per-Tenant (kept) */
        .modules-legend { background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
        .legend-title { font-size: 0.875rem; color: var(--text-color-secondary); margin-bottom: 0.75rem; display: block; }
        .legend-items { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .legend-chip { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: var(--surface-100); border-radius: 20px; font-size: 0.8rem; cursor: help; transition: all 0.2s; }
        .legend-chip:hover { background: color-mix(in srgb, var(--primary-color) 15%, transparent); }
        .chip-icon { font-size: 1rem; }
        .search-section { margin-bottom: 1.5rem; }
        .search-section input { width: 100%; max-width: 400px; }

        /* Skeleton */
        .skeleton-list { display: flex; flex-direction: column; gap: 1rem; }
        .skeleton-card { padding: 1.5rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: 12px; }
        .skeleton-header { display: flex; align-items: center; gap: 1rem; }
        .skeleton-text { flex: 1; }

        /* Accordion */
        .accordion-header { display: flex; align-items: center; gap: 1rem; width: 100%; padding-right: 1rem; }
        .tenant-avatar { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; color: white; flex-shrink: 0; }
        .tenant-info { flex: 1; min-width: 0; }
        .tenant-name { font-weight: 600; font-size: 1rem; display: block; margin-bottom: 0.25rem; }
        .tenant-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .module-progress { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; min-width: 100px; }
        .progress-label { font-size: 0.875rem; font-weight: 600; color: var(--primary-color); }
        :host ::ng-deep .progress-mini { height: 6px; width: 100px; }
        .modules-content { padding: 1rem 0; }
        .modules-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .module-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: 12px; cursor: pointer; transition: all 0.25s ease; }
        .module-card:hover { border-color: var(--primary-400); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .module-card.active { background: color-mix(in srgb, var(--primary-color) 8%, transparent); border-color: var(--primary-color); }
        .module-icon { font-size: 1.5rem; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: var(--surface-card); border-radius: 10px; flex-shrink: 0; }
        .module-details { flex: 1; min-width: 0; }
        .module-name { font-weight: 600; display: block; }
        .module-desc { font-size: 0.8rem; color: var(--text-color-secondary); }
        .actions-bar { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--surface-border); }
        .quick-actions { display: flex; gap: 0.5rem; }
        .empty-state { text-align: center; padding: 4rem 2rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: 12px; }
        .empty-state i { font-size: 3rem; color: var(--text-color-secondary); opacity: 0.5; margin-bottom: 1rem; }
        .empty-state h3 { margin: 0 0 0.5rem; }
        .empty-state p { color: var(--text-color-secondary); margin: 0; }

        @media (max-width: 768px) {
            .modules-page { padding: 1rem; }
            .page-header { flex-direction: column; }
            .stats-row { flex-direction: column; }
            h1 { font-size: 1.5rem; }
            .catalog-grid { grid-template-columns: 1fr; }
            .accordion-header { flex-wrap: wrap; }
            .module-progress { width: 100%; flex-direction: row; justify-content: space-between; margin-top: 0.5rem; }
            :host ::ng-deep .progress-mini { width: 60%; }
            .modules-grid { grid-template-columns: 1fr; }
            .actions-bar { flex-direction: column; gap: 1rem; }
            .quick-actions { width: 100%; justify-content: center; }
            .view-tabs { flex-direction: column; }
            .form-row-half { flex-direction: column; gap: 0.75rem; }
        }
    `]
})
export class ModulesCatalogComponent implements OnInit {
    private adminService = inject(AdminService);
    private messageService = inject(MessageService);
    private confirmService = inject(ConfirmationService);

    tenantsData = signal<TenantModules[]>([]);
    loading = signal(true);
    loadingModules = signal(true);
    savingModule = signal(false);
    searchTerm = '';
    allModules = signal<ModuleConfig[]>([]);
    activeTab = signal<'catalog' | 'tenants'>('catalog');

    // Module form
    showModuleDialog = false;
    editingModule = signal<ModuleConfig | null>(null);
    moduleForm: Partial<ModuleConfig> = { code: '', name: '', description: '', icon: '📦', category: 'Operaciones', sortOrder: 0, active: true };

    activeModuleCount = computed(() => this.allModules().filter(m => m.active).length);

    filteredTenants = computed(() => {
        const search = this.searchTerm.toLowerCase();
        if (!search) return this.tenantsData();
        return this.tenantsData().filter(item =>
            item.tenant.razonSocial.toLowerCase().includes(search) ||
            item.tenant.nombreFantasia?.toLowerCase().includes(search)
        );
    });

    ngOnInit() {
        this.loadModules();
        this.loadTenants();
    }

    loadModules() {
        this.loadingModules.set(true);
        this.adminService.getModulesFromApi().subscribe({
            next: (modules) => {
                this.allModules.set(modules);
                this.loadingModules.set(false);
            },
            error: () => {
                this.loadingModules.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los módulos' });
            }
        });
    }

    loadTenants() {
        this.loading.set(true);
        this.adminService.getTenants().subscribe({
            next: (tenants) => {
                const data = tenants.map(tenant => ({
                    tenant,
                    modules: this.mapTenantModules(tenant.modules),
                    saving: false
                }));
                this.tenantsData.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las empresas' });
            }
        });
    }

    mapTenantModules(modulesArray: string[] | undefined): Record<string, boolean> {
        const result: Record<string, boolean> = {};
        const activeModules = new Set(modulesArray || []);
        this.allModules().forEach(m => { result[m.code] = activeModules.has(m.code); });
        return result;
    }

    // ---- Module CRUD ----
    openNewModuleDialog() {
        this.editingModule.set(null);
        this.moduleForm = { code: '', name: '', description: '', icon: '📦', category: 'Operaciones', sortOrder: 0, active: true };
        this.showModuleDialog = true;
    }

    editModule(module: ModuleConfig) {
        this.editingModule.set(module);
        this.moduleForm = { ...module };
        this.showModuleDialog = true;
    }

    saveModule() {
        if (!this.moduleForm.code || !this.moduleForm.name) {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Código y nombre son requeridos' });
            return;
        }
        this.savingModule.set(true);
        const editing = this.editingModule();
        const obs = editing
            ? this.adminService.updateModule(editing.id, this.moduleForm)
            : this.adminService.createModule(this.moduleForm);

        obs.subscribe({
            next: () => {
                this.savingModule.set(false);
                this.showModuleDialog = false;
                this.loadModules();
                this.messageService.add({ severity: 'success', summary: editing ? 'Actualizado' : 'Creado', detail: `Módulo "${this.moduleForm.name}" guardado` });
            },
            error: () => {
                this.savingModule.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el módulo' });
            }
        });
    }

    confirmDeleteModule(module: ModuleConfig) {
        this.confirmService.confirm({
            message: `¿Eliminar módulo "${module.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-trash',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.adminService.deleteModule(module.id).subscribe({
                    next: () => {
                        this.loadModules();
                        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: `Módulo "${module.name}" eliminado` });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el módulo' });
                    }
                });
            }
        });
    }

    // ---- Per-Tenant Module Toggle ----
    toggleModule(item: TenantModules, code: string) {
        item.modules[code] = !item.modules[code];
    }

    enableAll(item: TenantModules) {
        this.allModules().forEach(m => { item.modules[m.code] = true; });
    }

    disableAll(item: TenantModules) {
        this.allModules().forEach(m => { item.modules[m.code] = false; });
    }

    saveModules(item: TenantModules) {
        item.saving = true;
        this.adminService.updateTenantModules(item.tenant.id, item.modules).subscribe({
            next: () => {
                item.saving = false;
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: `Módulos actualizados para ${item.tenant.razonSocial}` });
            },
            error: () => {
                item.saving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar los módulos' });
            }
        });
    }

    getActiveModuleCount(item: TenantModules): number {
        return Object.values(item.modules).filter(v => v).length;
    }

    getAvatarColor(type: string): string {
        const colors: Record<string, string> = {
            'RETAIL': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            'PANADERIA': 'linear-gradient(135deg, #f59e0b, #d97706)',
            'EDUCACION': 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            'EDITORIAL': 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            'RESTAURANTE': 'linear-gradient(135deg, #ef4444, #dc2626)',
            'SERVICIOS': 'linear-gradient(135deg, #10b981, #059669)'
        };
        return colors[type] || 'linear-gradient(135deg, #6b7280, #4b5563)';
    }

    getPlanSeverity(plan: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
        const severities: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast'> = {
            'FREE': 'secondary',
            'BASIC': 'info',
            'PRO': 'warning',
            'BUSINESS': 'success',
            'ENTERPRISE': 'contrast'
        };
        return severities[plan] || 'info';
    }
}
