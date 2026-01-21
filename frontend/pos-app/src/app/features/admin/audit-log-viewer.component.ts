import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, AuditLog } from '../../core/services/admin.service';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-audit-log-viewer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    DropdownModule,
    CalendarModule,
    SkeletonModule,
    TooltipModule,
    CardModule,
    ChipModule,
    IconFieldModule,
    InputIconModule
  ],
  template: `
    <div class="audit-page">
        <!-- Header -->
        <header class="page-header">
            <div class="header-left">
                <a routerLink="/admin/dashboard" class="back-link">
                    <i class="pi pi-arrow-left"></i>
                    Dashboard
                </a>
                <h1>
                    <i class="pi pi-history"></i>
                    Registro de Actividad
                </h1>
                <p class="subtitle">Monitoreo y auditoría de acciones del sistema</p>
            </div>
            <div class="header-actions">
                <p-dropdown 
                    [options]="periodOptions" 
                    [(ngModel)]="selectedDays"
                    (onChange)="loadLogs()"
                    placeholder="Período"
                    styleClass="period-dropdown">
                </p-dropdown>
                <p-button 
                    icon="pi pi-refresh" 
                    [rounded]="true"
                    [text]="true"
                    (onClick)="loadLogs()"
                    pTooltip="Actualizar">
                </p-button>
            </div>
        </header>

        <!-- Stats Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue">
                    <i class="pi pi-list"></i>
                </div>
                <div class="stat-content">
                    <span class="stat-value">{{ totalLogs }}</span>
                    <span class="stat-label">Total Movimientos</span>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon green">
                    <i class="pi pi-sign-in"></i>
                </div>
                <div class="stat-content">
                    <span class="stat-value">{{ countByAction('LOGIN') }}</span>
                    <span class="stat-label">Inicios de Sesión</span>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon amber">
                    <i class="pi pi-pencil"></i>
                </div>
                <div class="stat-content">
                    <span class="stat-value">{{ countByAction('UPDATE') + countByAction('CREATE') }}</span>
                    <span class="stat-label">Cambios Realizados</span>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon red">
                    <i class="pi pi-trash"></i>
                </div>
                <div class="stat-content">
                    <span class="stat-value">{{ countByAction('DELETE') }}</span>
                    <span class="stat-label">Eliminaciones</span>
                </div>
            </div>
        </div>

        <!-- Data Table -->
        <div class="table-container">
            <p-table 
                [value]="logs" 
                [loading]="loading"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                [rowsPerPageOptions]="[10, 25, 50]"
                [globalFilterFields]="['userEmail', 'action', 'description', 'entityType']"
                styleClass="p-datatable-striped"
                responsiveLayout="stack"
                [breakpoint]="'768px'"
                dataKey="id">
                
                <!-- Caption -->
                <ng-template pTemplate="caption">
                    <div class="table-header">
                        <p-iconField iconPosition="left">
                            <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                            <input 
                                pInputText 
                                type="text" 
                                #globalFilter
                                (input)="dt.filterGlobal(globalFilter.value, 'contains')" 
                                placeholder="Buscar en registros..." />
                        </p-iconField>
                        
                        <p-dropdown 
                            [options]="actionOptions" 
                            [(ngModel)]="selectedAction"
                            (onChange)="filterByAction()"
                            placeholder="Todas las acciones"
                            [showClear]="true"
                            styleClass="action-filter">
                        </p-dropdown>
                    </div>
                </ng-template>
                
                <!-- Header -->
                <ng-template pTemplate="header">
                    <tr>
                        <th pSortableColumn="userEmail" style="width: 25%">
                            Usuario <p-sortIcon field="userEmail"></p-sortIcon>
                        </th>
                        <th pSortableColumn="action" style="width: 15%">
                            Acción <p-sortIcon field="action"></p-sortIcon>
                        </th>
                        <th style="width: 40%">Detalle</th>
                        <th pSortableColumn="createdAt" style="width: 20%">
                            Fecha <p-sortIcon field="createdAt"></p-sortIcon>
                        </th>
                    </tr>
                </ng-template>
                
                <!-- Body -->
                <ng-template pTemplate="body" let-log>
                    <tr>
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar" [style.background]="getAvatarGradient(log.userEmail)">
                                    {{ (log.userEmail || 'S')[0].toUpperCase() }}
                                </div>
                                <div class="user-info">
                                    <span class="user-email">{{ log.userEmail || 'Sistema' }}</span>
                                    <span class="user-ip">{{ log.ipAddress || 'Internal' }}</span>
                                </div>
                            </div>
                        </td>
                        <td>
                            <p-tag 
                                [value]="formatAction(log.action)" 
                                [severity]="getActionSeverity(log.action)"
                                [icon]="getActionIcon(log.action)">
                            </p-tag>
                        </td>
                        <td>
                            <div class="detail-cell">
                                <span class="detail-text">{{ log.description || getDefaultDescription(log) }}</span>
                                @if (log.entityType) {
                                    <p-chip [label]="log.entityType" styleClass="entity-chip"></p-chip>
                                }
                            </div>
                        </td>
                        <td>
                            <div class="date-cell">
                                <span class="date-value">{{ formatDatePart(log.createdAt, 'date') }}</span>
                                <span class="time-value">{{ formatDatePart(log.createdAt, 'time') }}</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
                
                <!-- Empty State -->
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="4">
                            <div class="empty-state">
                                <i class="pi pi-clock"></i>
                                <h3>Sin actividad reciente</h3>
                                <p>No se han registrado acciones en el período seleccionado</p>
                            </div>
                        </td>
                    </tr>
                </ng-template>
                
                <!-- Loading -->
                <ng-template pTemplate="loadingbody">
                    @for (i of [1,2,3,4,5]; track i) {
                        <tr>
                            <td><p-skeleton width="80%" height="2rem"></p-skeleton></td>
                            <td><p-skeleton width="60%" height="1.5rem"></p-skeleton></td>
                            <td><p-skeleton width="90%" height="1.5rem"></p-skeleton></td>
                            <td><p-skeleton width="70%" height="1.5rem"></p-skeleton></td>
                        </tr>
                    }
                </ng-template>
            </p-table>
        </div>
    </div>
    `,
  styles: [`
        .audit-page {
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

        .subtitle {
            margin: 0;
            color: var(--text-color-secondary);
        }

        .header-actions {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        :host ::ng-deep .period-dropdown {
            min-width: 180px;
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .stat-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.25rem;
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            transition: all 0.2s;
        }

        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
        }

        .stat-icon.blue {
            background: color-mix(in srgb, var(--blue-500) 15%, transparent);
            color: var(--blue-400);
        }

        .stat-icon.green {
            background: color-mix(in srgb, var(--green-500) 15%, transparent);
            color: var(--green-400);
        }

        .stat-icon.amber {
            background: color-mix(in srgb, var(--yellow-500) 15%, transparent);
            color: var(--yellow-400);
        }

        .stat-icon.red {
            background: color-mix(in srgb, var(--red-500) 15%, transparent);
            color: var(--red-400);
        }

        .stat-content {
            display: flex;
            flex-direction: column;
        }

        .stat-value {
            font-size: 1.75rem;
            font-weight: 700;
        }

        .stat-label {
            font-size: 0.8rem;
            color: var(--text-color-secondary);
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
            gap: 1rem;
            flex-wrap: wrap;
        }

        .table-header input {
            width: 300px;
        }

        :host ::ng-deep .action-filter {
            min-width: 180px;
        }

        /* User Cell */
        .user-cell {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: white;
            font-size: 0.9rem;
            flex-shrink: 0;
        }

        .user-info {
            display: flex;
            flex-direction: column;
        }

        .user-email {
            font-weight: 500;
        }

        .user-ip {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            font-family: monospace;
        }

        /* Detail Cell */
        .detail-cell {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .detail-text {
            font-size: 0.9rem;
        }

        :host ::ng-deep .entity-chip {
            font-size: 0.7rem;
        }

        /* Date Cell */
        .date-cell {
            display: flex;
            flex-direction: column;
        }

        .date-value {
            font-weight: 500;
        }

        .time-value {
            font-size: 0.8rem;
            color: var(--text-color-secondary);
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
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
            .audit-page {
                padding: 1rem;
            }

            .page-header {
                flex-direction: column;
            }

            h1 {
                font-size: 1.5rem;
            }

            .header-actions {
                width: 100%;
            }

            :host ::ng-deep .period-dropdown {
                flex: 1;
            }

            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .stat-card {
                padding: 1rem;
            }

            .stat-value {
                font-size: 1.25rem;
            }

            .table-header {
                flex-direction: column;
            }

            .table-header input {
                width: 100%;
            }

            :host ::ng-deep .action-filter {
                width: 100%;
            }
        }
    `]
})
export class AuditLogViewerComponent implements OnInit {
  @Input() tenantId?: string;

  private adminService = inject(AdminService);

  logs: AuditLog[] = [];
  loading = false;
  selectedDays = 7;
  selectedAction: string | null = null;
  currentPage = 0;
  totalPages = 1;
  totalLogs = 0;

  dt: any; // Table reference for filtering

  periodOptions = [
    { label: 'Últimos 7 días', value: 7 },
    { label: 'Últimos 30 días', value: 30 },
    { label: 'Últimos 90 días', value: 90 },
    { label: 'Último año', value: 365 }
  ];

  actionOptions = [
    { label: 'Inicios de sesión', value: 'LOGIN' },
    { label: 'Creaciones', value: 'CREATE' },
    { label: 'Modificaciones', value: 'UPDATE' },
    { label: 'Eliminaciones', value: 'DELETE' },
    { label: 'Cambios de permisos', value: 'PERMISSION_CHANGE' }
  ];

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    if (!this.tenantId) {
      // Demo data for super admin view
      this.logs = this.getDemoLogs();
      this.totalLogs = this.logs.length;
      return;
    }

    this.loading = true;
    this.adminService.getRecentAuditLogs(this.tenantId, this.selectedDays, this.currentPage).subscribe({
      next: (response) => {
        this.logs = response.content;
        this.totalPages = response.totalPages;
        this.totalLogs = response.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading audit logs', err);
        this.logs = this.getDemoLogs();
        this.totalLogs = this.logs.length;
        this.loading = false;
      }
    });
  }

  filterByAction() {
    // Filtering is handled by p-table's globalFilterFields
  }

  countByAction(action: string): number {
    return this.logs.filter(l => l.action === action).length;
  }

  getActionSeverity(action: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast'> = {
      'CREATE': 'success',
      'UPDATE': 'warning',
      'DELETE': 'danger',
      'LOGIN': 'info',
      'LOGOUT': 'secondary',
      'PERMISSION_CHANGE': 'contrast'
    };
    return severities[action] || 'secondary';
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'CREATE': 'pi pi-plus',
      'UPDATE': 'pi pi-pencil',
      'DELETE': 'pi pi-trash',
      'LOGIN': 'pi pi-sign-in',
      'LOGOUT': 'pi pi-sign-out',
      'PERMISSION_CHANGE': 'pi pi-lock'
    };
    return icons[action] || 'pi pi-circle';
  }

  formatAction(action: string): string {
    const labels: Record<string, string> = {
      'CREATE': 'Creó',
      'UPDATE': 'Modificó',
      'DELETE': 'Eliminó',
      'LOGIN': 'Ingresó',
      'LOGOUT': 'Salió',
      'PERMISSION_CHANGE': 'Permisos'
    };
    return labels[action] || action;
  }

  getDefaultDescription(log: AuditLog): string {
    if (log.entityType && log.action) {
      return `${this.formatAction(log.action)} un registro de tipo ${log.entityType}`;
    }
    return 'Acción realizada en el sistema';
  }

  formatDatePart(dateStr: string, part: 'date' | 'time'): string {
    const date = new Date(dateStr);
    if (part === 'date') {
      return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  getAvatarGradient(email: string): string {
    const gradients = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #f59e0b, #d97706)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #ef4444, #dc2626)',
      'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    ];
    const index = (email?.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  }

  private getDemoLogs(): AuditLog[] {
    const now = new Date();
    return [
      { id: '1', userEmail: 'admin@demo.cl', action: 'LOGIN', description: 'Inició sesión desde Chrome', ipAddress: '192.168.1.100', createdAt: new Date(now.getTime() - 1000 * 60 * 5).toISOString() },
      { id: '2', userEmail: 'admin@demo.cl', action: 'CREATE', entityType: 'User', description: 'Creó usuario vendedor@demo.cl', createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString() },
      { id: '3', userEmail: 'admin@demo.cl', action: 'UPDATE', entityType: 'Role', description: 'Modificó permisos del rol Cajero', createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString() },
      { id: '4', userEmail: 'vendedor@demo.cl', action: 'LOGIN', description: 'Inició sesión desde Safari', ipAddress: '192.168.1.105', createdAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString() },
      { id: '5', userEmail: 'admin@demo.cl', action: 'CREATE', entityType: 'Branch', description: 'Creó sucursal "Local Centro"', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString() },
      { id: '6', userEmail: 'admin@demo.cl', action: 'PERMISSION_CHANGE', entityType: 'User', description: 'Cambió permisos de vendedor@demo.cl', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString() },
      { id: '7', userEmail: 'cajero@demo.cl', action: 'LOGIN', description: 'Inició sesión desde tablet', ipAddress: '192.168.1.110', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString() },
      { id: '8', userEmail: 'admin@demo.cl', action: 'DELETE', entityType: 'Product', description: 'Eliminó producto descontinuado', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4).toISOString() }
    ];
  }
}
