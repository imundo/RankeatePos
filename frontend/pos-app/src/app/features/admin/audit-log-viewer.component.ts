import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AuditLog } from '../../core/services/admin.service';

@Component({
    selector: 'app-audit-log-viewer',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="p-6 bg-slate-50 min-h-screen">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Registro de Actividad</h1>
          <p class="text-slate-500 mt-1">Historial de acciones del sistema</p>
        </div>
        <div class="flex gap-2">
          <select [(ngModel)]="selectedDays" (change)="loadLogs()" 
                  class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
            <option [value]="7">Últimos 7 días</option>
            <option [value]="30">Últimos 30 días</option>
            <option [value]="90">Últimos 90 días</option>
          </select>
          <button (click)="loadLogs()" 
                  class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-800">{{ totalLogs }}</p>
              <p class="text-sm text-slate-500">Total Acciones</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-800">{{ countByAction('LOGIN') }}</p>
              <p class="text-sm text-slate-500">Logins</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-800">{{ countByAction('UPDATE') }}</p>
              <p class="text-sm text-slate-500">Modificaciones</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-4 border border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-800">{{ countByAction('DELETE') }}</p>
              <p class="text-sm text-slate-500">Eliminaciones</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 class="font-semibold text-slate-800">Timeline de Actividad</h2>
        </div>
        
        <div class="divide-y divide-slate-100">
          <div *ngFor="let log of logs" class="px-6 py-4 hover:bg-slate-50 transition-colors">
            <div class="flex items-start gap-4">
              <!-- Action Icon -->
              <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                   [ngClass]="getActionClass(log.action)">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path *ngIf="log.action === 'CREATE'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  <path *ngIf="log.action === 'UPDATE'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  <path *ngIf="log.action === 'DELETE'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  <path *ngIf="log.action === 'LOGIN'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  <path *ngIf="!['CREATE','UPDATE','DELETE','LOGIN'].includes(log.action)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-slate-800">{{ log.userEmail || 'Sistema' }}</span>
                  <span class="px-2 py-0.5 text-xs rounded-full font-medium"
                        [ngClass]="getActionBadgeClass(log.action)">
                    {{ formatAction(log.action) }}
                  </span>
                </div>
                <p class="text-sm text-slate-600">{{ log.description || getDefaultDescription(log) }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span>{{ formatDate(log.createdAt) }}</span>
                  <span *ngIf="log.entityType">{{ log.entityType }}</span>
                  <span *ngIf="log.ipAddress">{{ log.ipAddress }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Empty State -->
        <div *ngIf="logs.length === 0 && !loading" class="py-16 text-center">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-slate-900">Sin registros</h3>
          <p class="text-slate-500 mt-2">No hay actividad registrada en este período.</p>
        </div>
        
        <!-- Loading -->
        <div *ngIf="loading" class="py-16 text-center">
          <div class="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p class="text-slate-500 mt-4">Cargando registros...</p>
        </div>
        
        <!-- Pagination -->
        <div *ngIf="totalPages > 1" class="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span class="text-sm text-slate-500">
            Página {{ currentPage + 1 }} de {{ totalPages }}
          </span>
          <div class="flex gap-2">
            <button (click)="prevPage()" [disabled]="currentPage === 0"
                    class="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
              Anterior
            </button>
            <button (click)="nextPage()" [disabled]="currentPage >= totalPages - 1"
                    class="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuditLogViewerComponent implements OnInit {
    @Input() tenantId?: string;

    private adminService = inject(AdminService);

    logs: AuditLog[] = [];
    loading = false;
    selectedDays = 7;
    currentPage = 0;
    totalPages = 1;
    totalLogs = 0;

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

    countByAction(action: string): number {
        return this.logs.filter(l => l.action === action).length;
    }

    getActionClass(action: string): string {
        const classes: Record<string, string> = {
            'CREATE': 'bg-green-100 text-green-600',
            'UPDATE': 'bg-amber-100 text-amber-600',
            'DELETE': 'bg-red-100 text-red-600',
            'LOGIN': 'bg-blue-100 text-blue-600',
            'LOGOUT': 'bg-slate-100 text-slate-600',
            'PERMISSION_CHANGE': 'bg-purple-100 text-purple-600'
        };
        return classes[action] || 'bg-slate-100 text-slate-600';
    }

    getActionBadgeClass(action: string): string {
        const classes: Record<string, string> = {
            'CREATE': 'bg-green-100 text-green-700',
            'UPDATE': 'bg-amber-100 text-amber-700',
            'DELETE': 'bg-red-100 text-red-700',
            'LOGIN': 'bg-blue-100 text-blue-700',
            'LOGOUT': 'bg-slate-100 text-slate-700',
            'PERMISSION_CHANGE': 'bg-purple-100 text-purple-700'
        };
        return classes[action] || 'bg-slate-100 text-slate-700';
    }

    formatAction(action: string): string {
        const labels: Record<string, string> = {
            'CREATE': 'Creó',
            'UPDATE': 'Modificó',
            'DELETE': 'Eliminó',
            'LOGIN': 'Inició sesión',
            'LOGOUT': 'Cerró sesión',
            'PERMISSION_CHANGE': 'Cambió permisos'
        };
        return labels[action] || action;
    }

    getDefaultDescription(log: AuditLog): string {
        if (log.entityType && log.action) {
            return `${this.formatAction(log.action)} un registro de tipo ${log.entityType}`;
        }
        return 'Acción realizada en el sistema';
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    prevPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.loadLogs();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            this.loadLogs();
        }
    }

    private getDemoLogs(): AuditLog[] {
        const now = new Date();
        return [
            { id: '1', userEmail: 'admin@demo.cl', action: 'LOGIN', description: 'Inició sesión desde Chrome', ipAddress: '192.168.1.100', createdAt: new Date(now.getTime() - 1000 * 60 * 5).toISOString() },
            { id: '2', userEmail: 'admin@demo.cl', action: 'CREATE', entityType: 'User', description: 'Creó usuario vendedor@demo.cl', createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString() },
            { id: '3', userEmail: 'admin@demo.cl', action: 'UPDATE', entityType: 'Role', description: 'Modificó permisos del rol Cajero', createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString() },
            { id: '4', userEmail: 'vendedor@demo.cl', action: 'LOGIN', description: 'Inició sesión desde Safari', ipAddress: '192.168.1.105', createdAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString() },
            { id: '5', userEmail: 'admin@demo.cl', action: 'CREATE', entityType: 'Branch', description: 'Creó sucursal "Local Centro"', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString() },
            { id: '6', userEmail: 'admin@demo.cl', action: 'PERMISSION_CHANGE', entityType: 'User', description: 'Cambió permisos de vendedor@demo.cl', createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString() }
        ];
    }
}
