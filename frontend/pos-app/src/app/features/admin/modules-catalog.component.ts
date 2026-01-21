import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, Tenant } from '../../core/services/admin.service';

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

interface ModuleConfig {
  code: string;
  name: string;
  icon: string;
  description: string;
}

interface TenantModules {
  tenant: Tenant;
  modules: Record<string, boolean>;
  saving?: boolean;
}

const ALL_MODULES: ModuleConfig[] = [
  { code: 'pos', name: 'Punto de Venta', icon: '💰', description: 'Terminal de ventas' },
  { code: 'inventory', name: 'Inventario', icon: '📦', description: 'Control de stock' },
  { code: 'invoicing', name: 'Facturación', icon: '📄', description: 'DTEs electrónicos' },
  { code: 'crm', name: 'CRM', icon: '👥', description: 'Gestión de clientes' },
  { code: 'loyalty', name: 'Fidelización', icon: '⭐', description: 'Puntos y premios' },
  { code: 'reservations', name: 'Reservas', icon: '📅', description: 'Citas online' },
  { code: 'kds', name: 'Cocina (KDS)', icon: '🍳', description: 'Pantalla comandas' },
  { code: 'payroll', name: 'RRHH', icon: '💼', description: 'Remuneraciones' },
  { code: 'accounting', name: 'Contabilidad', icon: '📊', description: 'Libros contables' }
];

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
    InputIconModule
  ],
  providers: [MessageService],
  template: `
    <p-toast position="top-right"></p-toast>
    
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
            <div class="header-stats">
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
                        <span class="stat-value">{{ allModules.length }}</span>
                        <span class="stat-label">Módulos</span>
                    </div>
                </div>
            </div>
        </header>

        <!-- Module Legend -->
        <div class="modules-legend">
            <span class="legend-title">Módulos disponibles:</span>
            <div class="legend-items">
                @for (module of allModules; track module.code) {
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
                                    <span class="progress-label">{{ getActiveModuleCount(item) }}/{{ allModules.length }}</span>
                                    <p-progressBar 
                                        [value]="(getActiveModuleCount(item) / allModules.length) * 100" 
                                        [showValue]="false"
                                        styleClass="progress-mini">
                                    </p-progressBar>
                                </div>
                            </div>
                        </ng-template>
                        
                        <div class="modules-content">
                            <div class="modules-grid">
                                @for (module of allModules; track module.code) {
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
    </div>
    `,
  styles: [`
        .modules-page {
            min-height: 100vh;
            background: var(--surface-ground);
            padding: 1.5rem;
        }

        /* Header */
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1.5rem;
        }

        .header-left {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-color-secondary);
            text-decoration: none;
            font-size: 0.875rem;
            transition: color 0.2s;
        }

        .back-link:hover {
            color: var(--primary-color);
        }

        h1 {
            margin: 0;
            font-size: 1.75rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        h1 i {
            color: var(--primary-color);
        }

        .subtitle {
            margin: 0;
            color: var(--text-color-secondary);
        }

        .header-stats {
            display: flex;
            gap: 1rem;
        }

        .stat-card {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
        }

        .stat-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: color-mix(in srgb, var(--primary-color) 15%, transparent);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--primary-color);
        }

        .stat-content {
            display: flex;
            flex-direction: column;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
        }

        .stat-label {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
        }

        /* Module Legend */
        .modules-legend {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
        }

        .legend-title {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            margin-bottom: 0.75rem;
            display: block;
        }

        .legend-items {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .legend-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background: var(--surface-100);
            border-radius: 20px;
            font-size: 0.8rem;
            cursor: help;
            transition: all 0.2s;
        }

        .legend-chip:hover {
            background: color-mix(in srgb, var(--primary-color) 15%, transparent);
        }

        .chip-icon {
            font-size: 1rem;
        }

        /* Search Section */
        .search-section {
            margin-bottom: 1.5rem;
        }

        .search-section input {
            width: 100%;
            max-width: 400px;
        }

        /* Skeleton Loading */
        .skeleton-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .skeleton-card {
            padding: 1.5rem;
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
        }

        .skeleton-header {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .skeleton-text {
            flex: 1;
        }

        /* Accordion Header */
        .accordion-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            width: 100%;
            padding-right: 1rem;
        }

        .tenant-avatar {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            font-weight: 700;
            color: white;
            flex-shrink: 0;
        }

        .tenant-info {
            flex: 1;
            min-width: 0;
        }

        .tenant-name {
            font-weight: 600;
            font-size: 1rem;
            display: block;
            margin-bottom: 0.25rem;
        }

        .tenant-meta {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        .module-progress {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.25rem;
            min-width: 100px;
        }

        .progress-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--primary-color);
        }

        :host ::ng-deep .progress-mini {
            height: 6px;
            width: 100px;
        }

        /* Modules Content */
        .modules-content {
            padding: 1rem 0;
        }

        .modules-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .module-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: var(--surface-ground);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.25s ease;
        }

        .module-card:hover {
            border-color: var(--primary-400);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .module-card.active {
            background: color-mix(in srgb, var(--primary-color) 8%, transparent);
            border-color: var(--primary-color);
        }

        .module-icon {
            font-size: 1.5rem;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--surface-card);
            border-radius: 10px;
            flex-shrink: 0;
        }

        .module-details {
            flex: 1;
            min-width: 0;
        }

        .module-name {
            font-weight: 600;
            display: block;
        }

        .module-desc {
            font-size: 0.8rem;
            color: var(--text-color-secondary);
        }

        /* Actions Bar */
        .actions-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 1rem;
            border-top: 1px solid var(--surface-border);
        }

        .quick-actions {
            display: flex;
            gap: 0.5rem;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
        }

        .empty-state i {
            font-size: 3rem;
            color: var(--text-color-secondary);
            opacity: 0.5;
            margin-bottom: 1rem;
        }

        .empty-state h3 {
            margin: 0 0 0.5rem;
        }

        .empty-state p {
            color: var(--text-color-secondary);
            margin: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .modules-page {
                padding: 1rem;
            }

            .page-header {
                flex-direction: column;
            }

            .header-stats {
                width: 100%;
            }

            .stat-card {
                flex: 1;
            }

            h1 {
                font-size: 1.5rem;
            }

            .accordion-header {
                flex-wrap: wrap;
            }

            .module-progress {
                width: 100%;
                flex-direction: row;
                justify-content: space-between;
                margin-top: 0.5rem;
            }

            :host ::ng-deep .progress-mini {
                width: 60%;
            }

            .modules-grid {
                grid-template-columns: 1fr;
            }

            .actions-bar {
                flex-direction: column;
                gap: 1rem;
            }

            .quick-actions {
                width: 100%;
                justify-content: center;
            }
        }
    `]
})
export class ModulesCatalogComponent implements OnInit {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);

  tenantsData = signal<TenantModules[]>([]);
  loading = signal(true);
  searchTerm = '';
  allModules = ALL_MODULES;

  filteredTenants = computed(() => {
    const search = this.searchTerm.toLowerCase();
    if (!search) return this.tenantsData();
    return this.tenantsData().filter(item =>
      item.tenant.razonSocial.toLowerCase().includes(search) ||
      item.tenant.nombreFantasia?.toLowerCase().includes(search)
    );
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
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
      error: (err) => {
        console.error('Error loading tenants:', err);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las empresas'
        });
      }
    });
  }

  mapTenantModules(modulesArray: string[] | undefined): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    const activeModules = new Set(modulesArray || []);
    ALL_MODULES.forEach(m => {
      result[m.code] = activeModules.has(m.code);
    });
    return result;
  }

  toggleModule(item: TenantModules, code: string) {
    item.modules[code] = !item.modules[code];
  }

  enableAll(item: TenantModules) {
    ALL_MODULES.forEach(m => { item.modules[m.code] = true; });
  }

  disableAll(item: TenantModules) {
    ALL_MODULES.forEach(m => { item.modules[m.code] = false; });
  }

  saveModules(item: TenantModules) {
    item.saving = true;
    this.adminService.updateTenantModules(item.tenant.id, item.modules).subscribe({
      next: () => {
        item.saving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: `Módulos actualizados para ${item.tenant.razonSocial}`
        });
      },
      error: (err) => {
        console.error('Error saving modules:', err);
        item.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron guardar los módulos'
        });
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
