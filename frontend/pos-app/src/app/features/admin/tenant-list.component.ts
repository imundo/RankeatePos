import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { TenantEditModalComponent } from './tenant-edit-modal.component';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { MessageService, ConfirmationService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

interface Tenant {
  id: string;
  rut: string;
  razonSocial: string;
  nombreFantasia: string;
  businessType: string;
  plan: string;
  modules?: string[];
  activo: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TenantEditModalComponent,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    ToastModule,
    ConfirmDialogModule,
    SkeletonModule,
    TooltipModule,
    RippleModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast position="top-right"></p-toast>
    <p-confirmDialog></p-confirmDialog>
    
    <div class="admin-page">
        <!-- Header -->
        <header class="page-header">
            <div class="header-left">
                <a routerLink="/admin/dashboard" class="back-link">
                    <i class="pi pi-arrow-left"></i>
                    Dashboard
                </a>
                <h1>
                    <i class="pi pi-building"></i>
                    Clientes
                </h1>
            </div>
            <p-button 
                label="Nuevo Cliente" 
                icon="pi pi-plus" 
                routerLink="/admin/tenants/new"
                styleClass="p-button-success">
            </p-button>
        </header>

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-item">
                <span class="stat-value">{{ tenants().length }}</span>
                <span class="stat-label">Total Clientes</span>
            </div>
            <div class="stat-item active">
                <span class="stat-value">{{ tenants().filter(t => t.activo).length }}</span>
                <span class="stat-label">Activos</span>
            </div>
            <div class="stat-item inactive">
                <span class="stat-value">{{ tenants().filter(t => !t.activo).length }}</span>
                <span class="stat-label">Suspendidos</span>
            </div>
        </div>

        <!-- Data Table -->
        <div class="table-container">
            <p-table 
                #dt
                [value]="tenants()" 
                [loading]="loading()"
                [paginator]="true" 
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} clientes"
                [rowsPerPageOptions]="[5, 10, 25, 50]"
                [globalFilterFields]="['razonSocial', 'nombreFantasia', 'rut', 'businessType', 'plan']"
                styleClass="p-datatable-striped p-datatable-gridlines"
                responsiveLayout="stack"
                [breakpoint]="'768px'"
                dataKey="id">
                
                <!-- Caption / Search -->
                <ng-template pTemplate="caption">
                    <div class="table-header">
                        <p-iconField iconPosition="left">
                            <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                            <input 
                                pInputText 
                                type="text" 
                                (input)="dt.filterGlobal($any($event.target).value, 'contains')" 
                                placeholder="Buscar clientes..." />
                        </p-iconField>
                        
                        <p-dropdown 
                            [options]="statusOptions" 
                            [(ngModel)]="statusFilter"
                            (onChange)="filterByStatus()"
                            placeholder="Estado"
                            [showClear]="true"
                            styleClass="status-filter">
                        </p-dropdown>
                    </div>
                </ng-template>
                
                <!-- Header -->
                <ng-template pTemplate="header">
                    <tr>
                        <th pSortableColumn="razonSocial">
                            Empresa <p-sortIcon field="razonSocial"></p-sortIcon>
                        </th>
                        <th pSortableColumn="rut">
                            RUT <p-sortIcon field="rut"></p-sortIcon>
                        </th>
                        <th pSortableColumn="businessType">
                            Industria <p-sortIcon field="businessType"></p-sortIcon>
                        </th>
                        <th pSortableColumn="plan">
                            Plan <p-sortIcon field="plan"></p-sortIcon>
                        </th>
                        <th pSortableColumn="activo">
                            Estado <p-sortIcon field="activo"></p-sortIcon>
                        </th>
                        <th style="width: 120px">Acciones</th>
                    </tr>
                </ng-template>
                
                <!-- Body -->
                <ng-template pTemplate="body" let-tenant>
                    <tr>
                        <td>
                            <div class="tenant-cell">
                                <div class="tenant-avatar" [style.background]="getAvatarGradient(tenant)">
                                    {{ tenant.razonSocial?.charAt(0) || 'T' }}
                                </div>
                                <div class="tenant-info">
                                    <span class="tenant-name">{{ tenant.razonSocial }}</span>
                                    @if (tenant.nombreFantasia) {
                                        <span class="tenant-fantasy">{{ tenant.nombreFantasia }}</span>
                                    }
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="rut-badge">{{ tenant.rut }}</span>
                        </td>
                        <td>
                            <p-tag [value]="tenant.businessType" [icon]="getIndustryIcon(tenant.businessType)" severity="info"></p-tag>
                        </td>
                        <td>
                            <p-tag [value]="tenant.plan" [severity]="getPlanSeverity(tenant.plan)"></p-tag>
                        </td>
                        <td>
                            <p-tag 
                                [value]="tenant.activo ? 'Activo' : 'Suspendido'" 
                                [severity]="tenant.activo ? 'success' : 'danger'"
                                [icon]="tenant.activo ? 'pi pi-check-circle' : 'pi pi-times-circle'">
                            </p-tag>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <p-button 
                                    icon="pi pi-pencil" 
                                    [rounded]="true" 
                                    [text]="true"
                                    severity="info"
                                    pTooltip="Editar" 
                                    (onClick)="editTenant(tenant)">
                                </p-button>
                                <p-button 
                                    [icon]="tenant.activo ? 'pi pi-ban' : 'pi pi-check'" 
                                    [rounded]="true" 
                                    [text]="true"
                                    [severity]="tenant.activo ? 'danger' : 'success'"
                                    [pTooltip]="tenant.activo ? 'Suspender' : 'Activar'" 
                                    (onClick)="confirmToggleStatus(tenant)">
                                </p-button>
                                <p-button 
                                    icon="pi pi-users" 
                                    [rounded]="true" 
                                    [text]="true"
                                    severity="secondary"
                                    pTooltip="Ver usuarios" 
                                    [routerLink]="['/admin/tenants', tenant.id, 'users']">
                                </p-button>
                            </div>
                        </td>
                    </tr>
                </ng-template>
                
                <!-- Empty State -->
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="6">
                            <div class="empty-state">
                                <i class="pi pi-building"></i>
                                <h3>No hay clientes</h3>
                                <p>Crea tu primer cliente para comenzar</p>
                                <p-button 
                                    label="Nuevo Cliente" 
                                    icon="pi pi-plus" 
                                    routerLink="/admin/tenants/new">
                                </p-button>
                            </div>
                        </td>
                    </tr>
                </ng-template>
                
                <!-- Loading -->
                <ng-template pTemplate="loadingbody">
                    @for (i of [1,2,3,4,5]; track i) {
                        <tr>
                            <td><p-skeleton width="80%" height="1.5rem"></p-skeleton></td>
                            <td><p-skeleton width="70%" height="1.5rem"></p-skeleton></td>
                            <td><p-skeleton width="60%" height="1.5rem"></p-skeleton></td>
                            <td><p-skeleton width="50%" height="1.5rem"></p-skeleton></td>
                            <td><p-skeleton width="40%" height="1.5rem"></p-skeleton></td>
                            <td><p-skeleton width="80px" height="1.5rem"></p-skeleton></td>
                        </tr>
                    }
                </ng-template>
            </p-table>
        </div>

        <!-- Edit Modal -->
        <app-tenant-edit-modal
            [isOpen]="isEditModalOpen"
            [tenantId]="selectedTenantId"
            (closeEvent)="closeEditModal()"
            (saveEvent)="onTenantSaved()">
        </app-tenant-edit-modal>
    </div>
    `,
  styles: [`
        .admin-page {
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

        /* Stats Bar */
        .stats-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .stat-item {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            padding: 1rem 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .stat-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-color);
        }

        .stat-label {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
        }

        .stat-item.active {
            border-left: 4px solid var(--green-500);
        }

        .stat-item.inactive {
            border-left: 4px solid var(--red-500);
        }

        /* Table Container */
        .table-container {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            overflow: hidden;
        }

        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .table-header input {
            width: 300px;
        }

        .status-filter {
            min-width: 150px;
        }

        /* Tenant Cell */
        .tenant-cell {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .tenant-avatar {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: white;
            font-size: 1rem;
            flex-shrink: 0;
        }

        .tenant-info {
            display: flex;
            flex-direction: column;
        }

        .tenant-name {
            font-weight: 600;
        }

        .tenant-fantasy {
            font-size: 0.8rem;
            color: var(--text-color-secondary);
        }

        .rut-badge {
            font-family: monospace;
            background: var(--surface-100);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.875rem;
        }

        /* Action Buttons */
        .action-buttons {
            display: flex;
            gap: 0.25rem;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
        }

        .empty-state i {
            font-size: 4rem;
            color: var(--text-color-secondary);
            opacity: 0.5;
            margin-bottom: 1rem;
        }

        .empty-state h3 {
            margin: 0 0 0.5rem;
            font-size: 1.25rem;
        }

        .empty-state p {
            color: var(--text-color-secondary);
            margin: 0 0 1.5rem;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .admin-page {
                padding: 1rem;
            }

            .page-header {
                flex-direction: column;
                align-items: stretch;
            }

            h1 {
                font-size: 1.5rem;
            }

            .table-header {
                flex-direction: column;
            }

            .table-header input {
                width: 100%;
            }

            .status-filter {
                width: 100%;
            }

            .stats-bar {
                grid-template-columns: repeat(3, 1fr);
            }

            .stat-item {
                padding: 0.75rem;
            }

            .stat-value {
                font-size: 1.25rem;
            }
        }
    `]
})
export class TenantListComponent implements OnInit {
  private adminService = inject(AdminService);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  tenants = signal<Tenant[]>([]);
  loading = signal(true);
  statusFilter: string | null = null;

  statusOptions = [
    { label: 'Activos', value: 'active' },
    { label: 'Suspendidos', value: 'inactive' }
  ];

  // Modal State
  isEditModalOpen = false;
  selectedTenantId: string | null = null;

  ngOnInit() {
    const created = this.route.snapshot.queryParams['created'];
    if (created) {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Cliente creado exitosamente'
      });
    }
    this.loadTenants();
  }

  loadTenants() {
    this.loading.set(true);
    this.adminService.getTenants().subscribe({
      next: (tenants) => {
        this.tenants.set(tenants as unknown as Tenant[]);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading tenants:', err);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los clientes'
        });
      }
    });
  }

  filterByStatus() {
    // The p-table handles filtering via globalFilterFields
    // For custom status filter, we could implement a custom filter
  }

  getAvatarGradient(tenant: Tenant): string {
    const gradients = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #ef4444, #dc2626)',
      'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    ];
    const index = (tenant.razonSocial?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  }

  getIndustryIcon(type: string): string {
    const icons: Record<string, string> = {
      'RETAIL': 'pi pi-shopping-cart',
      'PANADERIA': 'pi pi-star',
      'RESTAURANT': 'pi pi-star',
      'SERVICIOS': 'pi pi-briefcase',
      'OTRO': 'pi pi-building'
    };
    return icons[type] || 'pi pi-building';
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

  editTenant(tenant: Tenant) {
    this.selectedTenantId = tenant.id;
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedTenantId = null;
  }

  onTenantSaved() {
    this.messageService.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Cambios guardados correctamente'
    });
    this.loadTenants();
  }

  confirmToggleStatus(tenant: Tenant) {
    this.confirmationService.confirm({
      message: tenant.activo
        ? `¿Estás seguro de suspender a "${tenant.razonSocial}"? Los usuarios no podrán acceder.`
        : `¿Reactivar a "${tenant.razonSocial}"?`,
      header: tenant.activo ? 'Confirmar Suspensión' : 'Confirmar Activación',
      icon: tenant.activo ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle',
      acceptLabel: tenant.activo ? 'Suspender' : 'Activar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: tenant.activo ? 'p-button-danger' : 'p-button-success',
      accept: () => this.toggleStatus(tenant)
    });
  }

  toggleStatus(tenant: Tenant) {
    this.adminService.updateTenantStatus(tenant.id, !tenant.activo).subscribe({
      next: () => {
        this.loadTenants();
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `${tenant.razonSocial} ha sido ${!tenant.activo ? 'activado' : 'suspendido'}`
        });
      },
      error: (err) => {
        console.error('Error toggling status:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado'
        });
      }
    });
  }
}
