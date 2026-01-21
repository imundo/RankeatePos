import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ModuleAccess {
  key: string;
  code?: string; // Fallback for backend compatibility
  label?: string; // Fallback
  name?: string; // Fallback
  icon: string;
  category: string;
  enabled: boolean;
}

interface UserInfo {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  role?: string;
}

// Full granular list from AdminService
const MODULE_CONFIG: Record<string, { label: string, icon: string, category: string }> = {
  'dashboard': { label: '📊 Dashboard', icon: '📊', category: 'General' },

  'pos': { label: '💰 Nueva Venta (POS)', icon: '💰', category: 'Ventas' },
  'sales-history': { label: '📜 Historial de Ventas', icon: '📜', category: 'Ventas' },
  'cash-close': { label: '🔒 Cierre de Caja', icon: '🔒', category: 'Ventas' },
  'quotes': { label: '📝 Cotizaciones', icon: '📝', category: 'Ventas' },

  'inventory': { label: '📦 Lista de Productos', icon: '📦', category: 'Inventario' },
  'stock-movements': { label: '🚚 Movimientos de Stock', icon: '🚚', category: 'Inventario' },
  'suppliers': { label: '🏭 Proveedores', icon: '🏭', category: 'Inventario' },
  'purchases': { label: '🛒 Órdenes de Compra', icon: '🛒', category: 'Inventario' },

  'invoices': { label: '📄 Facturas Emitidas', icon: '📄', category: 'Finanzas' },
  'expenses': { label: '💸 Gastos y Pagos', icon: '💸', category: 'Finanzas' },
  'cash-flow': { label: '📈 Flujo de Caja', icon: '📈', category: 'Finanzas' },
  'banks': { label: '🏦 Cuentas Bancarias', icon: '🏦', category: 'Finanzas' },

  'reservations': { label: '📅 Agenda y Reservas', icon: '📅', category: 'Operaciones' },
  'kds': { label: '🍳 Pantalla Cocina (KDS)', icon: '🍳', category: 'Operaciones' },
  'menu-digital': { label: '📱 Menú Digital (QR)', icon: '📱', category: 'Operaciones' },

  'crm': { label: '👥 Base de Clientes', icon: '👥', category: 'Marketing' },
  'loyalty': { label: '🌟 Programa Lealtad', icon: '🌟', category: 'Marketing' },
  'email-marketing': { label: '📧 Campañas Email', icon: '📧', category: 'Marketing' },
  'whatsapp': { label: '💬 Mensajería WhatsApp', icon: '💬', category: 'Marketing' },

  'users': { label: '👤 Gestión Usuarios', icon: '👤', category: 'Configuración' },
  'company': { label: '🏢 Datos Empresa', icon: '🏢', category: 'Configuración' },
  'printers': { label: '🖨️ Impresoras', icon: '🖨️', category: 'Configuración' }
};

const CATEGORIES = ['General', 'Ventas', 'Inventario', 'Finanzas', 'Operaciones', 'Marketing', 'Configuración'];

@Component({
  selector: 'app-user-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="control-panel-container">
      <!-- Sidebar Control Panel -->
      <aside class="control-panel">
        <header class="panel-header">
          <div class="user-profile">
            <div class="avatar">{{ user()?.nombre?.charAt(0) || 'U' }}</div>
            <div class="user-details">
              <h2>{{ user()?.nombre }} {{ user()?.apellido }}</h2>
              <span class="role-badge">{{ user()?.role || 'Usuario' }}</span>
            </div>
          </div>
          <button class="btn-close" (click)="goBack()">×</button>
        </header>

        <div class="panel-body">
          <div class="search-box">
             <input type="text" placeholder="🔍 Buscar menú..." [(ngModel)]="searchTerm">
          </div>

          <!-- Permissions Matrix -->
          <div class="permissions-matrix">
            @for (category of categories; track category) {
              @if (hasModulesInCategory(category)) {
                <div class="category-group">
                  <div class="category-header">
                    <h3>{{ category }}</h3>
                    <label class="toggle-all">
                      <input type="checkbox" 
                             [checked]="isCategoryFullyEnabled(category)"
                             (change)="toggleCategory(category, $event)">
                      <span class="slider small"></span>
                    </label>
                  </div>
                  
                  <div class="modules-list">
                    @for (module of getModulesByCategory(category); track module.key) {
                      <div class="module-row" [class.enabled]="module.enabled">
                        <div class="module-info">
                          <span class="module-icon">{{ module.icon }}</span>
                          <span class="module-label">{{ module.label || module.name }}</span>
                        </div>
                        <label class="toggle">
                          <input type="checkbox" 
                                 [(ngModel)]="module.enabled">
                          <span class="slider"></span>
                        </label>
                      </div>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <footer class="panel-footer">
          <div class="footer-actions">
            <button class="btn-secondary" (click)="resetChanges()" [disabled]="!hasChanges()">
              Deshacer
            </button>
            <button class="btn-primary" (click)="saveChanges()" [disabled]="!hasChanges() || isSaving()">
              {{ isSaving() ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </footer>
      </aside>

      <!-- Overlay -->
      <div class="overlay" (click)="goBack()"></div>

      <!-- Toast -->
      @if (toast()) {
        <div class="toast" [class.success]="toast()!.type === 'success'" [class.error]="toast()!.type === 'error'">
          {{ toast()!.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(2px);
      z-index: 999;
      animation: fadeIn 0.3s ease;
    }

    .control-panel {
      position: relative;
      width: 450px;
      height: 100vh;
      background: #111827;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease;
    }

    .panel-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1f2937;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }

    .user-details h2 {
      margin: 0;
      font-size: 1.1rem;
      color: white;
    }

    .role-badge {
      font-size: 0.75rem;
      color: #9ca3af;
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 8px;
      border-radius: 12px;
    }

    .btn-close {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 2rem;
      cursor: pointer;
      line-height: 1;
    }
    .btn-close:hover { color: white; }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .search-box input {
      width: 100%;
      padding: 0.8rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: white;
      margin-bottom: 1.5rem;
    }
    .search-box input:focus {
      outline: none;
      border-color: #6366f1;
    }

    .category-group {
      margin-bottom: 2rem;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.8rem;
    }

    .category-header h3 {
      margin: 0;
      color: #6366f1;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .modules-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .module-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem 1rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 8px;
      transition: all 0.2s;
    }

    .module-row:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .module-row.enabled {
      background: rgba(16, 185, 129, 0.05);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .module-info {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .module-icon { font-size: 1.2rem; }
    .module-label { color: #e5e7eb; font-size: 0.95rem; }

    /* Toggles */
    .toggle { position: relative; width: 44px; height: 24px; display: inline-block; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; inset: 0;
      background: #374151; border-radius: 24px; transition: .3s;
    }
    .slider:before {
      content: ""; position: absolute; height: 18px; width: 18px;
      left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .3s;
    }
    input:checked + .slider { background: #10b981; }
    input:checked + .slider:before { transform: translateX(20px); }

    .toggle-all .slider.small { width: 36px; height: 20px; }
    .toggle-all .slider.small:before { width: 14px; height: 14px; }
    .toggle-all input:checked + .slider.small:before { transform: translateX(16px); }

    .panel-footer {
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: #1f2937;
    }

    .footer-actions {
      display: flex;
      gap: 1rem;
    }

    .footer-actions button {
      flex: 1;
      padding: 0.8rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    /* Animations */
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Mobile */
    @media (max-width: 640px) {
      .control-panel { width: 100%; }
    }
  `]
})
export class UserPermissionsComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  userId = signal<string>('');
  tenantId = signal<string>('');
  user = signal<UserInfo | null>(null);
  modules = signal<ModuleAccess[]>([]);
  originalModules = signal<ModuleAccess[]>([]); // For change detection
  isSaving = signal(false);
  toast = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  searchTerm = '';
  categories = CATEGORIES;

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('userId');
    const tenantId = this.route.snapshot.paramMap.get('id');

    if (userId) this.userId.set(userId);
    if (tenantId) this.tenantId.set(tenantId);

    this.loadUserPermissions();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  loadUserPermissions() {
    // Load user info
    this.http.get<UserInfo>(
      `${environment.authUrl}/api/admin/users/${this.userId()}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (user) => this.user.set(user),
      error: (err) => console.error('Error loading user:', err)
    });

    // Load permissions
    this.http.get<{ userId: string; modules: ModuleAccess[] }>(
      `${environment.authUrl}/api/admin/users/${this.userId()}/modules`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (response) => {
        // Merge backend response with full config to ensure all items are present
        const mergedModules = this.mergeWithConfig(response.modules);
        this.modules.set(mergedModules);
        this.originalModules.set(JSON.parse(JSON.stringify(mergedModules)));
      },
      error: (err) => {
        console.error('Error loading permissions:', err);
        // Fallback to full list disabled if error (or 404 if no permissions set yet)
        const defaultModules = this.mergeWithConfig([]);
        this.modules.set(defaultModules);
        this.originalModules.set(defaultModules);
      }
    });
  }

  // Ensures we display ALL available granular items, even if not yet in DB
  private mergeWithConfig(backendModules: any[]): ModuleAccess[] {
    const result: ModuleAccess[] = [];

    // Convert backend array to map for easy lookup
    // Backend keys might be 'key' or 'code', adjust as needed
    const backendMap = new Map();
    backendModules.forEach(m => backendMap.set(m.key || m.code, m.enabled));

    Object.entries(MODULE_CONFIG).forEach(([key, config]) => {
      result.push({
        key: key,
        label: config.label,
        icon: config.icon,
        category: config.category,
        enabled: backendMap.get(key) === true // Default false if not found
      });
    });

    return result;
  }

  getModulesByCategory(category: string): ModuleAccess[] {
    let filtered = this.modules().filter(m => m.category === category);
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        (m.label || '').toLowerCase().includes(term) ||
        m.category.toLowerCase().includes(term)
      );
    }
    return filtered;
  }

  hasModulesInCategory(category: string): boolean {
    return this.getModulesByCategory(category).length > 0;
  }

  isCategoryFullyEnabled(category: string): boolean {
    const mods = this.getModulesByCategory(category);
    return mods.length > 0 && mods.every(m => m.enabled);
  }

  toggleCategory(category: string, event: any) {
    const checked = event.target.checked;
    this.modules.update(current =>
      current.map(m => m.category === category ? { ...m, enabled: checked } : m)
    );
  }

  hasChanges = computed(() => {
    return JSON.stringify(this.modules()) !== JSON.stringify(this.originalModules());
  });

  resetChanges() {
    this.modules.set(JSON.parse(JSON.stringify(this.originalModules())));
  }

  saveChanges() {
    this.isSaving.set(true);
    const moduleStates: Record<string, boolean> = {};
    this.modules().forEach(m => {
      if (m.enabled) moduleStates[m.key] = true;
    });

    this.http.put(
      `${environment.authUrl}/api/admin/users/${this.userId()}/modules`,
      moduleStates,
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.originalModules.set(JSON.parse(JSON.stringify(this.modules())));
        this.showToast('success', '✅ Permisos actualizados');
        this.isSaving.set(false);
      },
      error: (err) => {
        console.error('Error saving:', err);
        this.showToast('error', 'Error al guardar');
        this.isSaving.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/tenants', this.tenantId(), 'users']);
  }

  showToast(type: 'success' | 'error', message: string) {
    this.toast.set({ type, message });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
