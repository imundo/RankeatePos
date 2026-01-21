import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AuditLog } from '../../core/services/admin.service';

@Component({
  selector: 'app-audit-log-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page p-6 min-h-screen">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-white">Registro de Actividad</h1>
          <p class="text-slate-400 mt-1">Historial de acciones del sistema</p>
        </div>
        <div class="flex gap-3">
          <select [(ngModel)]="selectedDays" (change)="loadLogs()" 
                  class="bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-2 border transition-colors outline-none focus:ring-2 focus:ring-indigo-500">
            <option [value]="7">Últimos 7 días</option>
            <option [value]="30">Últimos 30 días</option>
            <option [value]="90">Últimos 90 días</option>
          </select>
          <button (click)="loadLogs()" 
                  class="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-slate-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ totalLogs }}</p>
              <p class="text-sm text-slate-400">Total Acciones</p>
            </div>
          </div>
        </div>
        
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ countByAction('LOGIN') }}</p>
              <p class="text-sm text-slate-400">Logins</p>
            </div>
          </div>
        </div>
        
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ countByAction('UPDATE') }}</p>
              <p class="text-sm text-slate-400">Modificaciones</p>
            </div>
          </div>
        </div>
        
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ countByAction('DELETE') }}</p>
              <p class="text-sm text-slate-400">Eliminaciones</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Table -->
      <div class="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden backdrop-blur-sm">
        <div class="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
          <h2 class="font-semibold text-white">Timeline de Actividad</h2>
          <span class="text-xs text-slate-500 uppercase tracking-wider font-medium">En tiempo real</span>
        </div>
        
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-700/50 text-slate-400 text-xs uppercase">
                        <th class="px-6 py-4 font-medium">Usuario</th>
                        <th class="px-6 py-4 font-medium">Acción</th>
                        <th class="px-6 py-4 font-medium">Detalle</th>
                        <th class="px-6 py-4 font-medium text-right">Fecha</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-700/30">
                  <tr *ngFor="let log of logs" class="hover:bg-white/5 transition-colors group">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                           <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                             {{ (log.userEmail || 'S')[0].toUpperCase() }}
                           </div>
                           <div class="flex flex-col">
                             <span class="text-sm font-medium text-white">{{ log.userEmail || 'Sistema' }}</span>
                             <span class="text-xs text-slate-500">{{ log.ipAddress || 'Internal' }}</span>
                           </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                              [ngClass]="getActionBadgeClass(log.action)">
                           <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                           {{ formatAction(log.action) }}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex flex-col">
                           <span class="text-sm text-slate-300">{{ log.description || getDefaultDescription(log) }}</span>
                           <span *ngIf="log.entityType" class="text-xs text-slate-500 mt-0.5">Entidad: {{ log.entityType }}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <span class="text-sm text-slate-400 font-mono">{{ formatDate(log.createdAt) }}</span>
                    </td>
                  </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Empty State -->
        <div *ngIf="logs.length === 0 && !loading" class="py-16 text-center">
          <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600 border border-slate-700">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-white">Sin registros</h3>
          <p class="text-slate-500 mt-2">No hay actividad registrada en este período.</p>
        </div>
        
        <!-- Loading -->
        <div *ngIf="loading" class="py-16 text-center">
          <div class="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p class="text-slate-400 mt-4">Cargando registros...</p>
        </div>
        
        <!-- Pagination -->
        <div *ngIf="totalPages > 1" class="px-6 py-4 border-t border-slate-700/50 flex justify-between items-center bg-slate-800/30">
          <span class="text-sm text-slate-500">
            Página {{ currentPage + 1 }} de {{ totalPages }}
          </span>
          <div class="flex gap-2">
            <button (click)="prevPage()" [disabled]="currentPage === 0"
                    class="px-3 py-1.5 text-sm rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Anterior
            </button>
            <button (click)="nextPage()" [disabled]="currentPage >= totalPages - 1"
                    class="px-3 py-1.5 text-sm rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
