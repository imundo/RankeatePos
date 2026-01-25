import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService, AdminUser, Tenant } from '@core/services/admin.service';
import { UsersService, User } from '@core/services/users.service';

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
  private usersService = inject(UsersService);

  // Signals
  tenantId = signal<string>('');
  tenant = signal<any>(null); // We would fetch this if we had a TenantsService, or just rely on ID
  users = signal<any[]>([]);
  loading = signal(true);
  availableRoles = signal<string[]>([]);

  showModal = signal(false);
  editingUser = signal<any>(null);

  formUser: any = {
    nombre: '',
    email: '',
    password: '',
    roles: []
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.tenantId.set(id);
        this.loadData();
      }
    });
  }

  loadData() {
    this.loading.set(true);
    const tId = this.tenantId();

    // Fetch users for the specific tenant
    this.usersService.getUsers(0, 100, undefined, tId).subscribe({
      next: (response: any) => {
        this.users.set(response.content);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading users', err);
        this.loading.set(false);
      }
    });

    // Fetch roles available for assignment
    this.usersService.getRoles(tId).subscribe({
      next: (roles) => this.availableRoles.set(roles),
      error: (err) => console.error('Error loading roles', err)
    });
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'OWNER_ADMIN': 'Administrador',
      'MANAGER': 'Encargado',
      'CASHIER': 'Cajero',
      'STOCKKEEPER': 'Bodeguero',
      'ACCOUNTANT': 'Contador',
      'SAAS_ADMIN': 'Super Admin'
    };
    return labels[role] || role;
  }

  openUserModal(user?: any) {
    if (user) {
      this.editingUser.set(user);
      this.formUser = {
        nombre: user.nombre,
        email: user.email,
        password: '', // Don't show password
        roles: user.roles ? [...user.roles] : []
      };
    } else {
      this.editingUser.set(null);
      this.formUser = {
        nombre: '',
        email: '',
        password: '',
        roles: ['USER'] // Default role
      };
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.formUser = { nombre: '', email: '', password: '', roles: [] };
    this.editingUser.set(null);
  }

  toggleRole(role: string) {
    const roles = this.formUser.roles;
    const index = roles.indexOf(role);
    if (index === -1) {
      this.formUser.roles.push(role); // Add role
    } else {
      this.formUser.roles.splice(index, 1); // Remove role
    }
  }

  saveUser() {
    const tId = this.tenantId();
    if (this.editingUser()) {
      this.usersService.updateUser(this.editingUser().id, {
        nombre: this.formUser.nombre,
        roles: this.formUser.roles,
        activo: true
      }, tId).subscribe({
        next: (updated: any) => {
          this.users.update(users => users.map(u => u.id === updated.id ? updated : u));
          this.closeModal();
        },
        error: (err: any) => console.error('Error updating user', err)
      });
    } else {
      this.usersService.createUser({
        nombre: this.formUser.nombre,
        email: this.formUser.email,
        password: this.formUser.password,
        roles: this.formUser.roles,
        apellido: ''
      }, tId).subscribe({
        next: (newItem: any) => {
          this.users.update(users => [...users, newItem]);
          this.closeModal();
        },
        error: (err: any) => console.error('Error creating user', err)
      });
    }
  }

  toggleActive(user: any) {
    this.usersService.toggleUserActive(user.id, this.tenantId()).subscribe({
      next: (updated: any) => {
        this.users.update(users => users.map(u => u.id === updated.id ? updated : u));
      },
      error: (err: any) => console.error('Error toggling status', err)
    });
  }

  goToPermissions(user: any) {
    const tId = this.tenantId();
    if (tId) {
      this.router.navigate(['/admin/tenants', tId, 'users', user.id, 'permissions']);
    }
  }
}

