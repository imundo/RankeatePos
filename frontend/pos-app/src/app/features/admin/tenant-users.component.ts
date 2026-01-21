import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService, AdminUser, Tenant } from '@core/services/admin.service';

@Component({
  selector: 'app-tenant-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/admin/tenants" class="back-link">← Clientes</a>
          <h1>👥 Usuarios de {{ tenant()?.nombreFantasia || 'Cliente' }}</h1>
          <p class="subtitle">{{ tenant()?.razonSocial }}</p>
        </div>
        <button class="btn-primary" (click)="openUserModal()">
          ➕ Nuevo Usuario
        </button>
      </header>

      @if (loading()) {
        <div class="loading">Cargando usuarios...</div>
      } @else {
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Roles / Accesos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <div class="user-info">
                      <div class="avatar">{{ user.nombre.charAt(0).toUpperCase() }}</div>
                      <span>{{ user.nombre }}</span>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <div class="roles-list">
                      @for (role of user.roles; track role) {
                        <span class="badge role" [class.admin]="role === 'ADMIN'" [class.cashier]="role === 'CASHIER'">
                          {{ getRoleLabel(role) }}
                        </span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="badge status" [class.active]="user.activo" [class.inactive]="!user.activo">
                      {{ user.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="actions">
                      <button class="btn-icon" title="Permisos" (click)="goToPermissions(user)">🔐</button>
                      <button class="btn-icon" title="Editar" (click)="openUserModal(user)">✏️</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- User Modal -->
      @if (showModal()) {
        <div class="modal-backdrop">
          <div class="modal">
            <div class="modal-header">
              <h2>{{ editingUser() ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
              <button class="btn-close" (click)="closeModal()">×</button>
            </div>
            
            <form (ngSubmit)="saveUser()" class="modal-body">
              <div class="form-group">
                <label>Nombre Completo</label>
                <input type="text" [(ngModel)]="formUser.nombre" name="nombre" required>
              </div>

              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="formUser.email" name="email" required [disabled]="!!editingUser()">
              </div>

              @if (!editingUser()) {
                <div class="form-group">
                  <label>Contraseña</label>
                  <input type="password" [(ngModel)]="formUser.password" name="password" required>
                </div>
              }

              <div class="form-group">
                <label>Roles y Permisos</label>
                <div class="roles-grid">
                  <label class="role-checkbox" [class.checked]="formUser.roles.includes('OWNER_ADMIN')">
                    <input type="checkbox" (change)="toggleRole('OWNER_ADMIN')" [checked]="formUser.roles.includes('OWNER_ADMIN')">
                    <span class="role-title">Administrador</span>
                    <span class="role-desc">Acceso total a configuración y reportes</span>
                  </label>
                  
                  <label class="role-checkbox" [class.checked]="formUser.roles.includes('MANAGER')">
                    <input type="checkbox" (change)="toggleRole('MANAGER')" [checked]="formUser.roles.includes('MANAGER')">
                    <span class="role-title">Encargado</span>
                    <span class="role-desc">Gestión operativa y supervisión</span>
                  </label>

                  <label class="role-checkbox" [class.checked]="formUser.roles.includes('CASHIER')">
                    <input type="checkbox" (change)="toggleRole('CASHIER')" [checked]="formUser.roles.includes('CASHIER')">
                    <span class="role-title">Cajero</span>
                    <span class="role-desc">Ventas, caja y pedidos</span>
                  </label>

                  <label class="role-checkbox" [class.checked]="formUser.roles.includes('STOCKKEEPER')">
                    <input type="checkbox" (change)="toggleRole('STOCKKEEPER')" [checked]="formUser.roles.includes('STOCKKEEPER')">
                    <span class="role-title">Bodeguero</span>
                    <span class="role-desc">Gestión de stock e inventario</span>
                  </label>

                  <label class="role-checkbox" [class.checked]="formUser.roles.includes('ACCOUNTANT')">
                    <input type="checkbox" (change)="toggleRole('ACCOUNTANT')" [checked]="formUser.roles.includes('ACCOUNTANT')">
                    <span class="role-title">Contador</span>
                    <span class="role-desc">Acceso a reportes y finanzas</span>
                  </label>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
      color: white;
      padding: 2rem;
    }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-content h1 { margin: 0; font-size: 1.75rem; }
    .subtitle { color: rgba(255,255,255,0.5); margin: 0; }
    .back-link { color: rgba(255,255,255,0.5); text-decoration: none; display: block; margin-bottom: 0.5rem; }
    
    .table-container { background: rgba(255,255,255,0.03); border-radius: 16px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
    th { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); }
    
    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    .avatar { width: 32px; height: 32px; background: #6366F1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    
    .badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
    .badge.role { background: rgba(255,255,255,0.1); margin-right: 0.5rem; }
    .badge.role.admin { background: rgba(239,68,68,0.2); color: #FCA5A5; }
    .badge.role.cashier { background: rgba(16,185,129,0.2); color: #6EE7B7; }
    .badge.status.active { color: #6EE7B7; }
    
    .btn-primary { padding: 0.75rem 1.5rem; background: #6366F1; border: none; border-radius: 8px; color: white; cursor: pointer; }
    .btn-icon { background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer; padding: 0.4rem; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    .modal { background: #1a1a2e; width: 100%; max-width: 500px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
    .modal-header { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { margin: 0; font-size: 1.25rem; }
    .btn-close { background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { color: rgba(255,255,255,0.7); font-size: 0.9rem; }
    .form-group input { padding: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; }
    
    .roles-grid { display: grid; gap: 0.75rem; }
    .role-checkbox { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .role-checkbox.checked { background: rgba(99,102,241,0.1); border-color: #6366F1; }
    .role-checkbox input { width: auto; }
    .role-title { font-weight: 600; font-size: 0.9rem; }
    .role-desc { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-left: auto; }

    .modal-footer { padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; }
  `]
})
export class TenantUsersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);

  tenant = signal<Tenant | null>(null);
  users = signal<AdminUser[]>([]);
  loading = signal(true);

  showModal = signal(false);
  editingUser = signal<AdminUser | null>(null);

  formUser: any = {
    nombre: '',
    email: '',
    password: '',
    roles: []
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const tenantId = params.get('id');
      if (tenantId) {
        this.loadData(tenantId);
      }
    });
  }

  loadData(tenantId: string) {
    this.loading.set(true);
    // Load Tenant Info
    this.adminService.getTenant(tenantId).subscribe({
      next: (t) => this.tenant.set(t)
    });

    // Load Users (Mocking for now if API not ready, using AdminService)
    this.adminService.getTenantUsers(tenantId).subscribe({
      next: (u) => {
        this.users.set(u);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users', err);
        // Fallback for Demo
        if (tenantId === 'demo-bakery') {
          this.users.set([
            { id: '1', tenantId, nombre: 'Juan Panadero', email: 'juan@demo.cl', roles: ['ADMIN', 'CASHIER'], activo: true },
            { id: '2', tenantId, nombre: 'Maria Caja', email: 'maria@demo.cl', roles: ['CASHIER'], activo: true }
          ]);
        }
        this.loading.set(false);
      }
    });
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'OWNER_ADMIN': 'Administrador',
      'MANAGER': 'Encargado',
      'CASHIER': 'Cajero',
      'STOCKKEEPER': 'Bodeguero',
      'ACCOUNTANT': 'Contador'
    };
    return labels[role] || role;
  }

  openUserModal(user?: AdminUser) {
    if (user) {
      this.editingUser.set(user);
      this.formUser = { ...user };
    } else {
      this.editingUser.set(null);
      this.formUser = { nombre: '', email: '', password: '', roles: [] };
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  toggleRole(role: string) {
    const index = this.formUser.roles.indexOf(role);
    if (index === -1) {
      this.formUser.roles.push(role);
    } else {
      this.formUser.roles.splice(index, 1);
    }
  }

  saveUser() {
    console.log('Saving user:', this.formUser);
    // Call AdminService to save
    // Simulate success
    if (this.editingUser()) {
      this.adminService.updateUser(this.editingUser()!.id, {
        nombre: this.formUser.nombre,
        // correo no editable
        roles: this.formUser.roles,
        activo: true
      }).subscribe({
        next: (updated) => {
          this.users.update(users => users.map(u => u.id === updated.id ? updated : u));
          this.closeModal();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.adminService.createUser(this.tenant()!.id, {
        nombre: this.formUser.nombre,
        email: this.formUser.email,
        password: this.formUser.password,
        roles: this.formUser.roles
      }).subscribe({
        next: (newItem) => {
          this.users.update(users => [...users, newItem]);
          this.closeModal();
        },
        error: (err) => console.error(err)
      });
    }
  }

  goToPermissions(user: AdminUser) {
    const tenantId = this.tenant()?.id;
    if (tenantId) {
      this.router.navigate(['/admin/tenants', tenantId, 'users', user.id, 'permissions']);
    }
  }
}
