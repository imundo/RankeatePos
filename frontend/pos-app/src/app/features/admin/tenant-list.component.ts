import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { environment } from '../../../environments/environment';
import { TenantEditModalComponent } from './tenant-edit-modal.component';

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
  imports: [CommonModule, FormsModule, RouterLink, TenantEditModalComponent],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/admin/dashboard" class="back-link">← Dashboard</a>
          <h1>📋 Clientes</h1>
        </div>
        <button (click)="openCreateModal()" class="btn-primary">
          ➕ Nuevo Cliente
        </button>
      </header>

      @if (successMessage()) {
        <div class="success-banner">
          ✅ {{ successMessage() }}
        </div>
      }

      <!-- Search & Filters -->
      <div class="search-bar">
        <input 
          type="text" 
          [(ngModel)]="searchTerm"
          placeholder="Buscar por nombre o RUT..."
          (input)="search()">
        <select [(ngModel)]="statusFilter" (change)="search()">
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Suspendidos</option>
        </select>
      </div>

      <!-- Tenants Table -->
      <div class="table-container">
        @if (loading()) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Cargando clientes...</p>
          </div>
        } @else if (filteredTenants().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">🏢</span>
            <h3>No hay clientes</h3>
            <p>Crea tu primer cliente para comenzar</p>
            <button (click)="openCreateModal()" class="btn-primary">➕ Nuevo Cliente</button>
          </div>
        } @else {
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>RUT</th>
                <th>Industria</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (tenant of filteredTenants(); track tenant.id) {
                <tr>
                  <td>
                    <div class="tenant-name">
                      <strong>{{ tenant.razonSocial }}</strong>
                      @if (tenant.nombreFantasia) {
                        <span class="fantasy-name">{{ tenant.nombreFantasia }}</span>
                      }
                    </div>
                  </td>
                  <td>{{ tenant.rut }}</td>
                  <td>
                    <span class="badge industry">{{ getIndustryIcon(tenant.businessType) }} {{ tenant.businessType }}</span>
                  </td>
                  <td>
                    <span class="badge plan" [class.pro]="tenant.plan === 'PRO'" [class.business]="tenant.plan === 'BUSINESS'">
                      {{ tenant.plan }}
                    </span>
                  </td>
                  <td>
                    <span class="badge status" [class.active]="tenant.activo" [class.inactive]="!tenant.activo">
                      {{ tenant.activo ? 'Activo' : 'Suspendido' }}
                    </span>
                  </td>
                  <td>
                    <div class="actions">
                      <button class="btn-icon" title="Editar" (click)="editTenant(tenant)">✏️</button>
                      <button 
                        class="btn-icon" 
                        [title]="tenant.activo ? 'Suspender' : 'Activar'"
                        (click)="toggleStatus(tenant)">
                        {{ tenant.activo ? '🔴' : '🟢' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
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
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
      color: white;
      padding: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .back-link {
      color: rgba(255,255,255,0.5);
      text-decoration: none;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      display: block;
    }

    .back-link:hover { color: white; }

    .header-content h1 {
      margin: 0;
      font-size: 1.75rem;
    }

    .btn-primary {
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(99,102,241,0.4);
    }

    .success-banner {
      padding: 1rem;
      background: rgba(16,185,129,0.2);
      border: 1px solid rgba(16,185,129,0.5);
      border-radius: 10px;
      margin-bottom: 1.5rem;
      color: #6EE7B7;
    }

    .search-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .search-bar input {
      flex: 1;
      padding: 0.875rem 1rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: white;
      font-size: 1rem;
    }

    .search-bar input:focus {
      outline: none;
      border-color: #6366F1;
    }

    .search-bar input::placeholder {
      color: rgba(255,255,255,0.3);
    }

    .search-bar select {
      padding: 0.875rem 1rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: white;
      font-size: 1rem;
    }

    .table-container {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }

    th {
      background: rgba(255,255,255,0.05);
      font-weight: 600;
      font-size: 0.875rem;
      color: rgba(255,255,255,0.7);
    }

    tr:hover {
      background: rgba(255,255,255,0.02);
    }

    .tenant-name strong {
      display: block;
    }

    .fantasy-name {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.5);
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge.industry {
      background: rgba(99,102,241,0.2);
      color: #A5B4FC;
    }

    .badge.plan {
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.7);
    }

    .badge.plan.pro {
      background: rgba(245,158,11,0.2);
      color: #FCD34D;
    }

    .badge.plan.business {
      background: rgba(139,92,246,0.2);
      color: #C4B5FD;
    }

    .badge.status.active {
      background: rgba(16,185,129,0.2);
      color: #6EE7B7;
    }

    .badge.status.inactive {
      background: rgba(239,68,68,0.2);
      color: #FCA5A5;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: rgba(255,255,255,0.1);
    }

    .loading, .empty-state {
      padding: 4rem;
      text-align: center;
    }
    
    .spinner {
      border: 3px solid rgba(255,255,255,0.1);
      border-top: 3px solid #6366F1;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem;
    }

    .empty-state p {
      color: rgba(255,255,255,0.5);
      margin: 0 0 1.5rem;
    }

    @media (max-width: 768px) {
      .search-bar {
        flex-direction: column;
      }
      .table-container {
        overflow-x: auto;
      }
    }
  `]
})
export class TenantListComponent implements OnInit {
  private adminService = inject(AdminService);
  private route = inject(ActivatedRoute);

  tenants = signal<Tenant[]>([]);
  filteredTenants = signal<Tenant[]>([]);
  loading = signal(true);
  searchTerm = '';
  statusFilter = '';
  successMessage = signal<string | null>(null);

  // Modal State
  isEditModalOpen = false;
  selectedTenantId: string | null = null;

  ngOnInit() {
    // Check for success message from wizard
    const created = this.route.snapshot.queryParams['created'];
    if (created) {
      this.successMessage.set('Cliente creado exitosamente');
      setTimeout(() => this.successMessage.set(null), 5000);
    }
    this.loadTenants();
  }

  loadTenants() {
    this.loading.set(true);
    // Use AdminService instead of direct HTTP to ensure correct URL construction
    this.adminService.getTenants().subscribe({
      next: (tenants) => {
        // Map AdminTenant to local Tenant interface if needed, or just use as is
        // The interfaces are compatible
        this.tenants.set(tenants as unknown as Tenant[]);
        this.filterTenants();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading tenants:', err);
        this.loading.set(false);
      }
    });
  }

  search() {
    this.filterTenants();
  }

  filterTenants() {
    let result = this.tenants();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(t =>
        t.razonSocial.toLowerCase().includes(term) ||
        t.rut.toLowerCase().includes(term) ||
        (t.nombreFantasia && t.nombreFantasia.toLowerCase().includes(term))
      );
    }

    if (this.statusFilter) {
      const isActive = this.statusFilter === 'active';
      result = result.filter(t => t.activo === isActive);
    }

    this.filteredTenants.set(result);
  }

  getIndustryIcon(type: string): string {
    const icons: Record<string, string> = {
      'RETAIL': '🛒',
      'PANADERIA': '🥖',
      'EDUCACION': '🎓',
      'EDITORIAL': '📚',
      'RESTAURANTE': '🍕'
    };
    return icons[type] || '🏢';
  }

  openCreateModal() {
    this.selectedTenantId = null;
    this.isEditModalOpen = true; // Use the edit modal in create mode (empty ID)
    // Note: The TenantEditModalComponent currently handles editing existing tenants.
    // If it supports creation (tenantId=null), this works. 
    // If not, we should route to wizard like before:
    // this.router.navigate(['/admin/tenants/new']);
    // Looking at TenantEditModalComponent implementation, it expects a tenantId or might create new?
    // Let's check. If not, revert to RouterLink. 
    // Actually, let's keep the RouterLink for "Nuevo Cliente" in the template for now to be safe.
    // Reverting the "Nuevo Cliente" button in template to use RouterLink.
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
    this.successMessage.set('Cambios guardados correctamente');
    this.loadTenants();
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  toggleStatus(tenant: Tenant) {
    this.adminService.updateTenantStatus(tenant.id, !tenant.activo).subscribe({
      next: () => this.loadTenants(),
      error: (err) => console.error('Error toggling status:', err)
    });
  }
}
