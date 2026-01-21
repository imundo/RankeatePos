import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, Tenant } from '../../core/services/admin.service';

interface ModuleConfig {
  code: string;
  name: string;
  icon: string;
  description: string;
}

interface TenantModules {
  tenant: Tenant;
  modules: Record<string, boolean>;
  expanded: boolean;
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
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="modules-page">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/admin/dashboard" class="back-link">← Dashboard</a>
          <h1>📊 Gestión de Módulos</h1>
          <p class="subtitle">Control de acceso por empresa</p>
        </div>
        <div class="header-stats">
          <div class="stat">
            <span class="stat-value">{{ tenantsData().length }}</span>
            <span class="stat-label">Empresas</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ allModules.length }}</span>
            <span class="stat-label">Módulos</span>
          </div>
        </div>
      </header>

      <!-- Search -->
      <div class="search-section">
        <input 
          type="text" 
          [(ngModel)]="searchTerm" 
          placeholder="🔍 Buscar empresa..."
          class="search-input">
      </div>

      <!-- Module Legend -->
      <div class="modules-legend">
        <span class="legend-title">Módulos:</span>
        @for (module of allModules; track module.code) {
          <span class="legend-item" [title]="module.description">
            {{ module.icon }} {{ module.name }}
          </span>
        }
      </div>

      <!-- Tenants Grid -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando empresas...</p>
        </div>
      } @else {
        <div class="tenants-list">
          @for (item of filteredTenants(); track item.tenant.id; let i = $index) {
            <div class="tenant-card" [class.expanded]="item.expanded" [style.--delay]="i * 50 + 'ms'">
              <!-- Card Header -->
              <div class="card-header" (click)="toggleExpand(item)">
                <div class="tenant-info">
                  <div class="tenant-avatar" [style.background]="getAvatarColor(item.tenant.businessType)">
                    {{ item.tenant.razonSocial.charAt(0) }}
                  </div>
                  <div class="tenant-details">
                    <h3>{{ item.tenant.razonSocial }}</h3>
                    <span class="tenant-meta">
                      <span class="badge plan">{{ item.tenant.plan }}</span>
                      <span class="badge industry">{{ item.tenant.businessType }}</span>
                    </span>
                  </div>
                </div>
                <div class="card-actions">
                  <span class="module-count">{{ getActiveModuleCount(item) }}/{{ allModules.length }}</span>
                  <button class="expand-btn">
                    {{ item.expanded ? '▲' : '▼' }}
                  </button>
                </div>
              </div>

              <!-- Expanded Modules -->
              @if (item.expanded) {
                <div class="modules-grid">
                  @for (module of allModules; track module.code) {
                    <div class="module-item" [class.enabled]="item.modules[module.code]">
                      <div class="module-header">
                        <span class="module-icon">{{ module.icon }}</span>
                        <label class="toggle">
                          <input 
                            type="checkbox" 
                            [checked]="item.modules[module.code]"
                            (change)="toggleModule(item, module.code)">
                          <span class="slider"></span>
                        </label>
                      </div>
                      <span class="module-name">{{ module.name }}</span>
                      <span class="module-desc">{{ module.description }}</span>
                    </div>
                  }
                </div>
                <div class="card-footer">
                  <button class="btn-enable-all" (click)="enableAll(item)">✅ Habilitar todos</button>
                  <button class="btn-disable-all" (click)="disableAll(item)">❌ Deshabilitar todos</button>
                  <button class="btn-save" (click)="saveModules(item)">💾 Guardar cambios</button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a1a 0%, #12122a 50%, #1a1a3a 100%);
      color: white;
    }

    .modules-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    /* Header */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .header-left { display: flex; flex-direction: column; gap: 0.5rem; }
    .back-link { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 0.85rem; }
    .back-link:hover { color: white; }
    h1 { 
      margin: 0; 
      font-size: 1.75rem;
      background: linear-gradient(90deg, #fff, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { color: rgba(255,255,255,0.5); margin: 0; }

    .header-stats {
      display: flex;
      gap: 1.5rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem 1.5rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
    }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #10b981; }
    .stat-label { font-size: 0.75rem; color: rgba(255,255,255,0.5); }

    /* Search */
    .search-section { margin-bottom: 1.5rem; }
    .search-input {
      width: 100%;
      max-width: 400px;
      padding: 0.875rem 1.25rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      color: white;
      font-size: 1rem;
    }
    .search-input:focus {
      outline: none;
      border-color: #6366f1;
      background: rgba(99,102,241,0.1);
    }
    .search-input::placeholder { color: rgba(255,255,255,0.3); }

    /* Legend */
    .modules-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      padding: 1rem;
      background: rgba(255,255,255,0.02);
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }
    .legend-title { color: rgba(255,255,255,0.5); font-size: 0.85rem; }
    .legend-item {
      padding: 0.35rem 0.75rem;
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      font-size: 0.8rem;
      cursor: help;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: rgba(255,255,255,0.5);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Tenants List */
    .tenants-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .tenant-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      overflow: hidden;
      animation: fadeIn 0.4s ease forwards;
      animation-delay: var(--delay);
      opacity: 0;
    }
    @keyframes fadeIn { to { opacity: 1; } }

    .tenant-card.expanded {
      border-color: rgba(99,102,241,0.3);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .card-header:hover { background: rgba(255,255,255,0.02); }

    .tenant-info {
      display: flex;
      align-items: center;
      gap: 1rem;
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
    }

    .tenant-details h3 { margin: 0 0 0.25rem; font-size: 1.1rem; }
    .tenant-meta { display: flex; gap: 0.5rem; }

    .badge {
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge.plan { background: rgba(99,102,241,0.2); color: #a78bfa; }
    .badge.industry { background: rgba(16,185,129,0.2); color: #34d399; }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .module-count {
      padding: 0.5rem 1rem;
      background: rgba(16,185,129,0.15);
      border-radius: 20px;
      font-size: 0.9rem;
      color: #10b981;
      font-weight: 600;
    }

    .expand-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      color: white;
      cursor: pointer;
      transition: all 0.2s;
    }
    .expand-btn:hover { background: rgba(255,255,255,0.1); }

    /* Modules Grid */
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
      padding: 0 1.5rem 1rem;
    }

    .module-item {
      padding: 1rem;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      transition: all 0.2s;
    }
    .module-item.enabled {
      background: rgba(16,185,129,0.08);
      border-color: rgba(16,185,129,0.3);
    }

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .module-icon { font-size: 1.5rem; }
    .module-name { display: block; font-size: 0.9rem; font-weight: 600; }
    .module-desc { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.4); margin-top: 0.25rem; }

    /* Toggle */
    .toggle { position: relative; width: 44px; height: 24px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      transition: 0.3s;
    }
    .slider::before {
      content: '';
      position: absolute;
      width: 18px; height: 18px;
      left: 3px; bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }
    .toggle input:checked + .slider { background: #10b981; }
    .toggle input:checked + .slider::before { transform: translateX(20px); }

    /* Footer */
    .card-footer {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: rgba(0,0,0,0.2);
      border-top: 1px solid rgba(255,255,255,0.05);
    }

    .card-footer button {
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-enable-all { background: rgba(16,185,129,0.15); color: #10b981; }
    .btn-enable-all:hover { background: rgba(16,185,129,0.25); }
    .btn-disable-all { background: rgba(239,68,68,0.15); color: #f87171; }
    .btn-disable-all:hover { background: rgba(239,68,68,0.25); }
    .btn-save { 
      margin-left: auto;
      background: linear-gradient(135deg, #6366f1, #8b5cf6); 
      color: white;
    }
    .btn-save:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99,102,241,0.4); }

    /* Mobile */
    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 1rem; }
      .header-stats { width: 100%; }
      .modules-grid { grid-template-columns: repeat(2, 1fr); }
      .card-footer { flex-wrap: wrap; }
      .btn-save { margin-left: 0; width: 100%; margin-top: 0.5rem; }
    }
  `]
})
export class ModulesCatalogComponent implements OnInit {
  private adminService = inject(AdminService);

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
          expanded: false
        }));
        this.tenantsData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading tenants:', err);
        this.loading.set(false);
      }
    });
  }

  mapTenantModules(modulesArray: string[] | undefined): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    const activeModules = new Set(modulesArray || []);

    // Initialize all modules as false, then set true for active ones
    ALL_MODULES.forEach(m => {
      result[m.code] = activeModules.has(m.code);
    });
    return result;
  }

  // Deprecated: getModulesForPlan is no longer the primary source of truth, 
  // but we keep it referenced if needed for new tenants defaults.
  getModulesForPlan(plan: string): Record<string, boolean> {
    const planModules: Record<string, string[]> = {
      'FREE': ['pos'],
      'BASIC': ['pos', 'inventory'],
      'PRO': ['pos', 'inventory', 'invoicing', 'crm'],
      'BUSINESS': ['pos', 'inventory', 'invoicing', 'crm', 'loyalty', 'reservations'],
      'ENTERPRISE': ALL_MODULES.map(m => m.code)
    };

    const enabled = planModules[plan] || planModules['FREE'];
    const result: Record<string, boolean> = {};
    ALL_MODULES.forEach(m => { result[m.code] = enabled.includes(m.code); });
    return result;
  }

  toggleExpand(item: TenantModules) {
    this.tenantsData.update(list =>
      list.map(t => t.tenant.id === item.tenant.id ? { ...t, expanded: !t.expanded } : t)
    );
  }

  toggleModule(item: TenantModules, code: string) {
    this.tenantsData.update(list =>
      list.map(t => {
        if (t.tenant.id === item.tenant.id) {
          return { ...t, modules: { ...t.modules, [code]: !t.modules[code] } };
        }
        return t;
      })
    );
  }

  enableAll(item: TenantModules) {
    const allEnabled: Record<string, boolean> = {};
    ALL_MODULES.forEach(m => { allEnabled[m.code] = true; });
    this.tenantsData.update(list =>
      list.map(t => t.tenant.id === item.tenant.id ? { ...t, modules: allEnabled } : t)
    );
  }

  disableAll(item: TenantModules) {
    const allDisabled: Record<string, boolean> = {};
    ALL_MODULES.forEach(m => { allDisabled[m.code] = false; });
    this.tenantsData.update(list =>
      list.map(t => t.tenant.id === item.tenant.id ? { ...t, modules: allDisabled } : t)
    );
  }

  saveModules(item: TenantModules) {
    this.loading.set(true);
    this.adminService.updateTenantModules(item.tenant.id, item.modules).subscribe({
      next: () => {
        // Success feedback could be a toast, for now alert is okay or just console
        console.log(`Módulos actualizados para ${item.tenant.razonSocial}`);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error saving modules:', err);
        alert('Error al guardar los módulos. Intente nuevamente.');
        this.loading.set(false);
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
      'RESTAURANTE': 'linear-gradient(135deg, #ef4444, #dc2626)'
    };
    return colors[type] || 'linear-gradient(135deg, #6b7280, #4b5563)';
  }
}
