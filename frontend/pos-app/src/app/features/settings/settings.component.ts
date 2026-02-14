import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';
import { BranchesComponent } from '../admin/branches.component';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BranchesComponent],
  template: `
    <div class="settings-container">
      <header class="settings-header">
        <div class="header-left">
          <button class="btn-icon" routerLink="/dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-title">
            <h1>⚙️ Configuración</h1>
            <span class="subtitle">Administración del sistema</span>
          </div>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs-container">
        <button class="tab" [class.active]="activeTab() === 'general'" (click)="activeTab.set('general')">
          <span>🏪</span> General
        </button>
        <button class="tab" [class.active]="activeTab() === 'users'" (click)="activeTab.set('users')">
          <span>👥</span> Usuarios
        </button>
        <button class="tab" [class.active]="activeTab() === 'branches'" (click)="activeTab.set('branches')">
          <span>📍</span> Sucursales
        </button>
        <button class="tab" [class.active]="activeTab() === 'integrations'" (click)="activeTab.set('integrations')">
          <span>🔌</span> Integraciones
        </button>
        <button class="tab" [class.active]="activeTab() === 'taxes'" (click)="activeTab.set('taxes')">
          <span>🧾</span> Impuestos
        </button>
      </div>

      <div class="settings-content">
        <!-- General Tab -->
        @if (activeTab() === 'general') {
          <section class="section">
            <div class="section-header">
              <h3>👤 Perfil de Usuario</h3>
            </div>
            <div class="settings-card">
              <div class="profile-info">
                <div class="avatar">{{ userInitials() }}</div>
                <div class="user-details">
                  <span class="user-name">{{ userName() }}</span>
                  <span class="user-email">{{ userEmail() }}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="section">
            <div class="section-header">
              <h3>🏪 Información del Negocio</h3>
              <button class="btn-edit" routerLink="/company">Editar</button>
            </div>
            <div class="settings-card">
              <div class="info-row">
                <span class="label">Nombre</span>
                <span class="value">{{ tenantName() }}</span>
              </div>
              <div class="info-row">
                <span class="label">RUT</span>
                <span class="value">{{ tenantRut() }}</span>
              </div>
              <div class="info-row">
                <span class="label">Plan</span>
                <span class="value plan-badge">{{ tenantPlan() }}</span>
              </div>
              <div class="info-row">
                <span class="label">País</span>
                <span class="value">{{ authService.tenant()?.country || 'Chile' }}</span>
              </div>
            </div>
          </section>

          <section class="section">
            <button class="btn-logout" (click)="logout()">
              🚪 Cerrar Sesión
            </button>
          </section>
        }

        <!-- Users Tab -->
        @if (activeTab() === 'users') {
          <section class="section">
            <div class="section-header">
              <h3>👥 Usuarios del Sistema</h3>
              <button class="btn-add" (click)="openUserDialog()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Nuevo Usuario
              </button>
            </div>

            <div class="data-table">
              <div class="table-header">
                <span>Nombre</span>
                <span>Email</span>
                <span>Rol</span>
                <span>Estado</span>
                <span>Acciones</span>
              </div>
              @for (user of users(); track user.id) {
                <div class="table-row">
                  <span class="cell-main">{{ user.nombre }}</span>
                  <span class="cell-secondary">{{ user.email }}</span>
                  <span class="cell-badge">{{ user.rol }}</span>
                  <span class="cell-status" [class.active]="user.activo">
                    {{ user.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                  <span class="cell-actions">
                    <button class="btn-action" (click)="editUser(user)">✏️</button>
                    <button class="btn-action danger" (click)="deleteUser(user)">🗑️</button>
                  </span>
                </div>
              } @empty {
                <div class="empty-state">
                  <span>👥</span>
                  <p>No hay usuarios registrados</p>
                </div>
              }
            </div>
          </section>
        }

        <!-- Branches Tab using Component -->
        @if (activeTab() === 'branches') {
          <app-branches></app-branches>
        }

        <!-- Integrations Tab -->
        @if (activeTab() === 'integrations') {
          <section class="section">
            <div class="section-header">
              <h3>🔌 Integraciones Externas</h3>
            </div>
            
            <div class="settings-card">
              <!-- SII Integration -->
              <div class="info-row">
                <div class="integration-info">
                  <span class="icon">🏛️</span>
                  <div>
                    <span class="block font-medium">Servicio de Impuestos Internos (SII)</span>
                    <span class="text-sm text-gray-400">Emisión automática de Boletas y Facturas Electrónicas</span>
                  </div>
                </div>
                <label class="switch">
                  <input type="checkbox" 
                         [checked]="configs()['integration.sii'] === 'true'"
                         (change)="toggleIntegration('integration.sii', $event)">
                  <span class="slider round"></span>
                </label>
              </div>

              <!-- MercadoPago -->
              <div class="info-row">
                <div class="integration-info">
                  <span class="icon">💳</span>
                  <div>
                    <span class="block font-medium">MercadoPago</span>
                    <span class="text-sm text-gray-400">Cobros con QR y tarjetas</span>
                  </div>
                </div>
                <label class="switch">
                  <input type="checkbox" 
                         [checked]="configs()['integration.mercadopago'] === 'true'"
                         (change)="toggleIntegration('integration.mercadopago', $event)">
                  <span class="slider round"></span>
                </label>
              </div>

              <!-- WhatsApp -->
              <div class="info-row">
                <div class="integration-info">
                  <span class="icon">📱</span>
                  <div>
                    <span class="block font-medium">WhatsApp Business</span>
                    <span class="text-sm text-gray-400">Notificaciones automáticas a clientes</span>
                  </div>
                </div>
                <label class="switch">
                  <input type="checkbox" 
                         [checked]="configs()['integration.whatsapp'] === 'true'"
                         (change)="toggleIntegration('integration.whatsapp', $event)">
                  <span class="slider round"></span>
                </label>
              </div>

              <!-- Email -->
              <div class="info-row">
                <div class="integration-info">
                  <span class="icon">📧</span>
                  <div>
                    <span class="block font-medium">Email Server (SMTP)</span>
                    <span class="text-sm text-gray-400">Envío de reportes y comprobantes</span>
                  </div>
                </div>
                <label class="switch">
                  <input type="checkbox" 
                         [checked]="configs()['integration.email'] === 'true'"
                         (change)="toggleIntegration('integration.email', $event)">
                  <span class="slider round"></span>
                </label>
              </div>
            </div>
          </section>
        }

        <!-- Taxes Tab -->
        @if (activeTab() === 'taxes') {
          <section class="section">
            <div class="section-header">
              <h3>🧾 Configuración de Impuestos</h3>
            </div>
            
            <div class="settings-card">
              <div class="tax-config">
                <div class="tax-row">
                  <span class="tax-label">País</span>
                  <select class="tax-select" [(ngModel)]="selectedCountry" (change)="saveCountry()">
                    <option value="Chile">🇨🇱 Chile</option>
                    <option value="Argentina">🇦🇷 Argentina</option>
                    <option value="Peru">🇵🇪 Perú</option>
                    <option value="Colombia">🇨🇴 Colombia</option>
                    <option value="Mexico">🇲🇽 México</option>
                    <option value="Ecuador">🇪🇨 Ecuador</option>
                  </select>
                </div>
                <div class="tax-row">
                  <span class="tax-label">Impuesto Principal</span>
                  <span class="tax-value">
                    @switch (selectedCountry) {
                      @case ('Chile') { IVA 19% }
                      @case ('Argentina') { IVA 21% }
                      @case ('Peru') { IGV 18% }
                      @case ('Colombia') { IVA 19% }
                      @case ('Mexico') { IVA 16% }
                      @case ('Ecuador') { IVA 12% }
                      @default { Variable }
                    }
                  </span>
                </div>
                <div class="tax-row">
                  <span class="tax-label">Moneda</span>
                  <span class="tax-value">
                    @switch (selectedCountry) {
                      @case ('Chile') { CLP ($) }
                      @case ('Argentina') { ARS ($) }
                      @case ('Peru') { PEN (S/) }
                      @case ('Colombia') { COP ($) }
                      @case ('Mexico') { MXN ($) }
                      @case ('Ecuador') { USD ($) }
                      @default { USD ($) }
                    }
                  </span>
                </div>
                <div class="tax-row">
                  <span class="tax-label">Zona Horaria</span>
                  <span class="tax-value">America/Santiago</span>
                </div>
              </div>
            </div>

            <div class="info-box">
              <span class="info-icon">ℹ️</span>
              <p>La configuración de impuestos y moneda se actualiza automáticamente al cambiar el país.</p>
            </div>
          </section>
        }
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
    }

    .settings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-left { display: flex; align-items: center; gap: 1rem; }

    .btn-icon {
      width: 40px; height: 40px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      background: transparent; color: white;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      svg { width: 20px; height: 20px; }
    }

    .header-title h1 { margin: 0; font-size: 1.5rem; }
    .header-title .subtitle { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }

    .tabs-container {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: rgba(30, 41, 59, 0.5);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      overflow-x: auto;
    }

    .tab {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover { background: rgba(255, 255, 255, 0.05); }
      &.active {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
        border-color: rgba(99, 102, 241, 0.5);
        color: white;
      }
    }

    .settings-content { padding: 1.5rem; }

    .section { margin-bottom: 1.5rem; }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h3 { margin: 0; font-size: 1.1rem; }
    }

    .btn-add, .btn-edit {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none; border-radius: 8px;
      color: white; font-weight: 500;
      cursor: pointer;
      svg { width: 16px; height: 16px; }
    }

    .btn-edit {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .settings-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.25rem;
    }

    .profile-info { display: flex; align-items: center; gap: 1rem; }

    .avatar {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.25rem;
    }

    .user-details { display: flex; flex-direction: column; }
    .user-name { font-size: 1.1rem; font-weight: 600; }
    .user-email { font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      &:last-child { border: none; padding-bottom: 0; }
      &:first-child { padding-top: 0; }
    }

    .label { color: rgba(255, 255, 255, 0.5); }
    .value { font-weight: 500; }

    .plan-badge {
      background: linear-gradient(135deg, #10B981, #059669);
      padding: 0.25rem 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .btn-logout {
      width: 100%;
      padding: 1rem;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      color: #EF4444;
      font-weight: 600;
      cursor: pointer;
      &:hover { background: rgba(239, 68, 68, 0.25); }
    }

    /* Data Table */
    .data-table {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      overflow: hidden;
    }

    .table-header, .table-row {
      display: grid;
      grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr;
      gap: 1rem;
      padding: 1rem 1.25rem;
      align-items: center;
    }

    .table-header {
      background: rgba(255, 255, 255, 0.05);
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
    }

    .table-row {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      &:last-child { border: none; }
    }

    .cell-main { font-weight: 500; }
    .cell-secondary { color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; }
    .cell-badge {
      padding: 0.25rem 0.75rem;
      background: rgba(99, 102, 241, 0.2);
      border-radius: 6px;
      font-size: 0.8rem;
      display: inline-block;
    }
    .cell-status {
      padding: 0.25rem 0.75rem;
      background: rgba(239, 68, 68, 0.2);
      border-radius: 6px;
      font-size: 0.8rem;
      &.active { background: rgba(16, 185, 129, 0.2); color: #10B981; }
    }

    .cell-actions { display: flex; gap: 0.5rem; }
    .btn-action {
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border: none; border-radius: 6px;
      cursor: pointer;
      &.danger:hover { background: rgba(239, 68, 68, 0.3); }
    }

    /* Taxes */
    .tax-config { display: flex; flex-direction: column; gap: 1rem; }

    .tax-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      &:last-child { border: none; }
    }

    .tax-label { color: rgba(255, 255, 255, 0.6); }
    .tax-value { font-weight: 500; color: #10B981; }

    .tax-select {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: white;
      cursor: pointer;
    }

    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-top: 1rem;
      padding: 1rem;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 12px;
      p { margin: 0; font-size: 0.9rem; color: rgba(255, 255, 255, 0.7); }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: rgba(255, 255, 255, 0.5);
      span { font-size: 3rem; margin-bottom: 1rem; }
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .settings-container {
        padding-bottom: 5rem; /* Space for bottom nav */
      }

      .settings-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
      }

      .header-title h1 {
        font-size: 1.25rem;
      }

      .tabs-container {
        padding: 0.5rem 1rem;
        margin: 0;
        border-radius: 0;
      }

      .tab {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      }

      .settings-content {
        padding: 1rem;
      }

      /* Stack Info Rows */
      .info-row {
        flex-direction: column;
        gap: 0.25rem;
        align-items: flex-start;
      }

      .label {
        font-size: 0.8rem;
      }

      .integration-info {
        margin-bottom: 0.5rem;
      }

      /* Responsive Data Table (Card View) */
      .table-header {
        display: none;
      }

      .table-row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        margin-bottom: 0.75rem;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .cell-main {
        font-size: 1.1rem;
        font-weight: 600;
        color: white;
      }

      .cell-actions {
        margin-top: 0.5rem;
        width: 100%;
        display: flex;
        justify-content: flex-end;
      }

      /* Stack Tax Rows */
      .tax-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .tax-value {
        font-size: 1.1rem;
      }

      .tax-select {
        width: 100%;
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = environment.apiUrl;

  activeTab = signal<'general' | 'users' | 'branches' | 'taxes'>('general');
  users = signal<User[]>([]);
  selectedCountry = 'CL';

  userName = () => this.authService.user()?.nombre || 'Usuario';
  userEmail = () => this.authService.user()?.email || '';
  userInitials = () => {
    const name = this.userName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  tenantName = () => this.authService.tenant()?.nombre || 'Mi Negocio';
  tenantRut = () => this.authService.tenant()?.rut || '';
  tenantPlan = () => this.authService.tenant()?.plan || 'PREMIUM';

  private getHeaders() {
    const token = this.authService.getToken();
    const tenant = this.authService.tenant();
    return {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-Id': tenant?.id || '',
      'X-User-Id': this.authService.user()?.id || ''
    };
  }

  configs = signal<Record<string, string>>({});
  isLoading = signal(false);

  ngOnInit() {
    this.loadUsers();
    this.loadConfigs();
    if (this.authService.tenant()?.country) {
      this.selectedCountry = this.authService.tenant()?.country || 'Chile';
    }
  }

  loadConfigs() {
    this.http.get<Record<string, string>>(`${this.baseUrl}/tenants/current/configs`, { headers: this.getHeaders() })
      .subscribe({
        next: (configs) => this.configs.set(configs),
        error: (err) => console.error('Error loading configs', err)
      });
  }

  saveCountry() {
    this.isLoading.set(true);
    this.http.put(`${this.baseUrl}/tenants/current`, { country: this.selectedCountry }, { headers: this.getHeaders() })
      .subscribe({
        next: (tenant: any) => {
          // Update local storage tenant
          const current = this.authService.tenant();
          if (current) {
            const updated = { ...current, country: this.selectedCountry };
            localStorage.setItem('pos_tenant', JSON.stringify(updated));
            window.location.reload(); // Reload to apply changes (currency, taxes, etc.)
          }
        },
        error: (err) => {
          console.error('Error updating country', err);
          this.isLoading.set(false);
        },
        complete: () => this.isLoading.set(false)
      });
  }

  toggleIntegration(key: string, event: any) {
    const value = event.target.checked.toString();
    const configs = { ...this.configs(), [key]: value };

    this.http.put(`${this.baseUrl}/tenants/current/configs`, { [key]: value }, { headers: this.getHeaders() })
      .subscribe({
        next: () => this.configs.set(configs),
        error: (err) => {
          console.error('Error updating config', err);
          // Revert on error
          event.target.checked = !event.target.checked;
        }
      });
  }

  loadUsers() {
    this.http.get<User[]>(`${this.baseUrl}/users`, { headers: this.getHeaders() })
      .subscribe({
        next: (users) => this.users.set(users),
        error: () => {
          // Mock data for demo
          this.users.set([
            { id: '1', nombre: 'Admin Principal', email: 'admin@demo.cl', rol: 'ADMIN', activo: true },
            { id: '2', nombre: 'Cajero Juan', email: 'cajero@demo.cl', rol: 'CAJERO', activo: true },
          ]);
        }
      });
  }

  openUserDialog(user?: User) {
    console.log('Open user dialog', user);
  }

  editUser(user: User) {
    this.openUserDialog(user);
  }

  deleteUser(user: User) {
    if (confirm(`¿Eliminar usuario ${user.nombre}?`)) {
      console.log('Delete user', user);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
