import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ModuleAccess {
    moduleId: string;
    code: string;
    name: string;
    icon: string;
    category: string;
    enabled: boolean;
}

interface GroupedModules {
    category: string;
    label: string;
    modules: ModuleAccess[];
}

interface UserInfo {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    activo: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
    'Core': '🏪 Operaciones Básicas',
    'Growth': '📈 Crecimiento',
    'Admin': '⚙️ Administración'
};

const PRESETS = [
    { id: 'CAJERO', label: 'Cajero', icon: '💵', desc: 'POS y ventas básicas' },
    { id: 'BODEGUERO', label: 'Bodeguero', icon: '📦', desc: 'Inventario y stock' },
    { id: 'ENCARGADO', label: 'Encargado', icon: '👔', desc: 'Operaciones + Reportes' },
    { id: 'ADMIN', label: 'Administrador', icon: '👑', desc: 'Acceso completo' }
];

@Component({
    selector: 'app-user-permissions',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <div class="permissions-container">
      <!-- Header -->
      <header class="permissions-header">
        <button class="btn-back" (click)="goBack()">
          <span>←</span> Volver
        </button>
        <div class="header-content">
          <h1>🔐 Permisos de Usuario</h1>
          @if (user()) {
            <p class="user-info">
              <span class="user-name">{{ user()!.nombre }} {{ user()!.apellido }}</span>
              <span class="user-email">{{ user()!.email }}</span>
            </p>
          }
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="resetChanges()" [disabled]="!hasChanges()">
            ↩️ Deshacer
          </button>
          <button class="btn-primary" (click)="saveChanges()" [disabled]="!hasChanges() || isSaving()">
            @if (isSaving()) {
              <span class="spinner"></span> Guardando...
            } @else {
              💾 Guardar Cambios
            }
          </button>
        </div>
      </header>

      <!-- Presets -->
      <section class="presets-section">
        <h2 class="section-title">⚡ Aplicar Preset Rápido</h2>
        <div class="presets-grid">
          @for (preset of presets; track preset.id) {
            <button class="preset-card" (click)="applyPreset(preset.id)" 
                    [class.active]="activePreset() === preset.id">
              <span class="preset-icon">{{ preset.icon }}</span>
              <span class="preset-label">{{ preset.label }}</span>
              <span class="preset-desc">{{ preset.desc }}</span>
            </button>
          }
        </div>
      </section>

      <!-- Bulk Actions -->
      <section class="bulk-actions">
        <button class="btn-outline" (click)="enableAll()">✅ Habilitar Todos</button>
        <button class="btn-outline danger" (click)="disableAll()">❌ Deshabilitar Todos</button>
      </section>

      <!-- Module Groups -->
      <section class="modules-section">
        @for (group of groupedModules(); track group.category) {
          <div class="module-group">
            <header class="group-header">
              <h3>{{ group.label }}</h3>
              <div class="group-actions">
                <button class="btn-sm" (click)="toggleCategory(group.category, true)">
                  Habilitar
                </button>
                <button class="btn-sm" (click)="toggleCategory(group.category, false)">
                  Quitar
                </button>
              </div>
            </header>
            <div class="modules-grid">
              @for (module of group.modules; track module.code) {
                <label class="module-toggle" [class.enabled]="module.enabled" 
                       (click)="toggleModule(module)">
                  <div class="module-info">
                    <span class="module-icon">{{ module.icon }}</span>
                    <span class="module-name">{{ module.name }}</span>
                  </div>
                  <div class="toggle-switch" [class.on]="module.enabled">
                    <span class="toggle-slider"></span>
                  </div>
                </label>
              }
            </div>
          </div>
        }
      </section>

      <!-- Summary -->
      <section class="summary-section">
        <div class="summary-card">
          <span class="summary-label">Módulos habilitados</span>
          <span class="summary-value">{{ enabledCount() }} / {{ totalCount() }}</span>
          <div class="summary-bar">
            <div class="summary-fill" [style.width.%]="enabledPercent()"></div>
          </div>
        </div>
      </section>

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
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a1a 0%, #12122a 100%);
      color: white;
    }

    .permissions-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    /* Header */
    .permissions-header {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .btn-back {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-back:hover {
      background: rgba(255,255,255,0.1);
    }

    .header-content {
      flex: 1;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin: 0;
    }

    .user-name {
      font-weight: 600;
      color: rgba(255,255,255,0.9);
    }

    .user-email {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.5);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .btn-primary:disabled, .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: rgba(255,255,255,0.1);
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(255,255,255,0.15);
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Presets */
    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: rgba(255,255,255,0.9);
    }

    .presets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .preset-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
    }

    .preset-card:hover {
      background: rgba(255,255,255,0.06);
      border-color: rgba(99, 102, 241, 0.5);
      transform: translateY(-2px);
    }

    .preset-card.active {
      background: rgba(99, 102, 241, 0.15);
      border-color: #6366f1;
    }

    .preset-icon {
      font-size: 1.75rem;
    }

    .preset-label {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .preset-desc {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.5);
    }

    /* Bulk Actions */
    .bulk-actions {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .btn-outline {
      padding: 0.6rem 1.25rem;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-outline:hover {
      background: rgba(255,255,255,0.05);
      border-color: rgba(255,255,255,0.3);
    }

    .btn-outline.danger:hover {
      border-color: rgba(239, 68, 68, 0.5);
      color: #ef4444;
    }

    /* Module Groups */
    .module-group {
      margin-bottom: 2rem;
    }

    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .group-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .group-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.35rem 0.75rem;
      font-size: 0.75rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-sm:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.75rem;
    }

    .module-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .module-toggle:hover {
      background: rgba(255,255,255,0.05);
    }

    .module-toggle.enabled {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.05);
    }

    .module-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .module-icon {
      font-size: 1.25rem;
    }

    .module-name {
      font-weight: 500;
    }

    .toggle-switch {
      width: 44px;
      height: 24px;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
      position: relative;
      transition: all 0.3s ease;
    }

    .toggle-switch.on {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .toggle-slider {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: all 0.3s ease;
    }

    .toggle-switch.on .toggle-slider {
      transform: translateX(20px);
    }

    /* Summary */
    .summary-section {
      margin-top: 2rem;
    }

    .summary-card {
      padding: 1.25rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
    }

    .summary-label {
      font-size: 0.9rem;
      color: rgba(255,255,255,0.7);
    }

    .summary-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0.5rem 0;
    }

    .summary-bar {
      height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .summary-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #6366f1);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      animation: slideUp 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
      z-index: 1000;
    }

    .toast.success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .toast.error {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes fadeOut {
      to { opacity: 0; }
    }

    /* Mobile */
    @media (max-width: 768px) {
      .permissions-header {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
        justify-content: stretch;
      }

      .header-actions button {
        flex: 1;
      }

      .presets-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .modules-grid {
        grid-template-columns: 1fr;
      }

      .toast {
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
      }
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
    originalModules = signal<ModuleAccess[]>([]);
    activePreset = signal<string | null>(null);
    isSaving = signal(false);
    toast = signal<{ type: 'success' | 'error'; message: string } | null>(null);

    presets = PRESETS;

    groupedModules = computed(() => {
        const groups: Record<string, ModuleAccess[]> = {};

        for (const module of this.modules()) {
            if (!groups[module.category]) {
                groups[module.category] = [];
            }
            groups[module.category].push(module);
        }

        return Object.entries(groups)
            .sort(([a], [b]) => {
                const order = ['Core', 'Growth', 'Admin'];
                return order.indexOf(a) - order.indexOf(b);
            })
            .map(([category, modules]) => ({
                category,
                label: CATEGORY_LABELS[category] || category,
                modules
            }));
    });

    enabledCount = computed(() => this.modules().filter(m => m.enabled).length);
    totalCount = computed(() => this.modules().length);
    enabledPercent = computed(() =>
        this.totalCount() > 0 ? (this.enabledCount() / this.totalCount()) * 100 : 0
    );

    hasChanges = computed(() => {
        const current = JSON.stringify(this.modules().map(m => ({ code: m.code, enabled: m.enabled })));
        const original = JSON.stringify(this.originalModules().map(m => ({ code: m.code, enabled: m.enabled })));
        return current !== original;
    });

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
        this.http.get<{ userId: string; modules: ModuleAccess[] }>(
            `${environment.authUrl}/api/admin/users/${this.userId()}/modules`,
            { headers: this.getHeaders() }
        ).subscribe({
            next: (response) => {
                this.modules.set(response.modules);
                this.originalModules.set(JSON.parse(JSON.stringify(response.modules)));
            },
            error: (err) => {
                console.error('Error loading permissions:', err);
                this.showToast('error', 'Error al cargar permisos');
            }
        });

        // Load user info
        this.http.get<UserInfo>(
            `${environment.authUrl}/api/admin/users/${this.userId()}`,
            { headers: this.getHeaders() }
        ).subscribe({
            next: (user) => this.user.set(user),
            error: (err) => console.error('Error loading user:', err)
        });
    }

    toggleModule(module: ModuleAccess) {
        const updated = this.modules().map(m =>
            m.code === module.code ? { ...m, enabled: !m.enabled } : m
        );
        this.modules.set(updated);
        this.activePreset.set(null);
    }

    toggleCategory(category: string, enabled: boolean) {
        const updated = this.modules().map(m =>
            m.category === category ? { ...m, enabled } : m
        );
        this.modules.set(updated);
        this.activePreset.set(null);
    }

    enableAll() {
        this.modules.set(this.modules().map(m => ({ ...m, enabled: true })));
        this.activePreset.set(null);
    }

    disableAll() {
        this.modules.set(this.modules().map(m => ({ ...m, enabled: false })));
        this.activePreset.set(null);
    }

    applyPreset(preset: string) {
        this.isSaving.set(true);
        this.http.post<{ userId: string; modules: ModuleAccess[] }>(
            `${environment.authUrl}/api/admin/users/${this.userId()}/modules/preset`,
            { preset },
            { headers: this.getHeaders() }
        ).subscribe({
            next: (response) => {
                this.modules.set(response.modules);
                this.originalModules.set(JSON.parse(JSON.stringify(response.modules)));
                this.activePreset.set(preset);
                this.showToast('success', `Preset "${preset}" aplicado`);
                this.isSaving.set(false);
            },
            error: (err) => {
                console.error('Error applying preset:', err);
                this.showToast('error', 'Error al aplicar preset');
                this.isSaving.set(false);
            }
        });
    }

    resetChanges() {
        this.modules.set(JSON.parse(JSON.stringify(this.originalModules())));
        this.activePreset.set(null);
    }

    saveChanges() {
        this.isSaving.set(true);

        const moduleStates: Record<string, boolean> = {};
        for (const module of this.modules()) {
            moduleStates[module.code] = module.enabled;
        }

        this.http.put<{ userId: string; modules: ModuleAccess[] }>(
            `${environment.authUrl}/api/admin/users/${this.userId()}/modules`,
            moduleStates,
            { headers: this.getHeaders() }
        ).subscribe({
            next: (response) => {
                this.modules.set(response.modules);
                this.originalModules.set(JSON.parse(JSON.stringify(response.modules)));
                this.showToast('success', '✅ Permisos guardados correctamente');
                this.isSaving.set(false);
            },
            error: (err) => {
                console.error('Error saving permissions:', err);
                this.showToast('error', 'Error al guardar permisos');
                this.isSaving.set(false);
            }
        });
    }

    goBack() {
        this.router.navigate(['/admin/tenants', this.tenantId(), 'users']);
    }

    private showToast(type: 'success' | 'error', message: string) {
        this.toast.set({ type, message });
        setTimeout(() => this.toast.set(null), 3000);
    }
}
