import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';

interface AdminStats {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    mrr: number;
    churnRate: number;
}

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="admin-page">
      <header class="page-header">
        <div class="header-content">
          <h1>👑 SmartPos Admin</h1>
          <p>Panel de control de la plataforma</p>
        </div>
        <a routerLink="/admin/tenants/new" class="btn-primary">
          ➕ Nuevo Cliente
        </a>
      </header>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏢</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalTenants || 0 }}</span>
            <span class="stat-label">Total Clientes</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.activeTenants || 0 }}</span>
            <span class="stat-label">Activos</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats()?.totalUsers || 0 }}</span>
            <span class="stat-label">Usuarios</span>
          </div>
        </div>
        <div class="stat-card accent">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <span class="stat-value">{{ formatMRR(stats()?.mrr || 0) }}</span>
            <span class="stat-label">MRR</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <section class="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div class="actions-grid">
          <a routerLink="/admin/tenants" class="action-card">
            <span class="action-icon">📋</span>
            <span class="action-title">Ver Clientes</span>
            <span class="action-desc">Gestionar todos los clientes</span>
          </a>
          <a routerLink="/admin/tenants/new" class="action-card">
            <span class="action-icon">🚀</span>
            <span class="action-title">Nuevo Cliente</span>
            <span class="action-desc">Crear con wizard paso a paso</span>
          </a>
          <div class="action-card disabled">
            <span class="action-icon">💳</span>
            <span class="action-title">Facturación</span>
            <span class="action-desc">Próximamente</span>
          </div>
          <div class="action-card disabled">
            <span class="action-icon">📊</span>
            <span class="action-title">Reportes</span>
            <span class="action-desc">Próximamente</span>
          </div>
        </div>
      </section>

      <!-- Logout -->
      <div class="logout-section">
        <button class="btn-logout" (click)="logout()">
          🚪 Cerrar Sesión
        </button>
      </div>
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

    .header-content h1 {
      margin: 0;
      font-size: 2rem;
    }

    .header-content p {
      margin: 0.5rem 0 0;
      color: rgba(255,255,255,0.5);
    }

    .btn-primary {
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(99,102,241,0.4);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      transition: all 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      border-color: rgba(99,102,241,0.3);
    }

    .stat-card.accent {
      background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05));
      border-color: rgba(16,185,129,0.3);
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.5);
    }

    .quick-actions h2 {
      font-size: 1.25rem;
      margin: 0 0 1rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 2rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      text-decoration: none;
      color: white;
      transition: all 0.2s;
    }

    .action-card:not(.disabled):hover {
      background: rgba(99,102,241,0.1);
      border-color: rgba(99,102,241,0.3);
      transform: translateY(-4px);
    }

    .action-card.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .action-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .action-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .action-desc {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.5);
    }

    .logout-section {
      margin-top: 3rem;
      text-align: center;
    }

    .btn-logout {
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: 1px solid rgba(239,68,68,0.5);
      border-radius: 10px;
      color: #FCA5A5;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-logout:hover {
      background: rgba(239,68,68,0.1);
      border-color: #EF4444;
    }

    @media (max-width: 1024px) {
      .stats-grid, .actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .stats-grid, .actions-grid {
        grid-template-columns: 1fr;
      }
      .page-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    stats = signal<AdminStats | null>(null);

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.authService.getToken()}`
        });

        this.http.get<AdminStats>(`${environment.authUrl}/api/admin/stats`, { headers })
            .subscribe({
                next: (data) => this.stats.set(data),
                error: (err) => console.error('Error loading admin stats:', err)
            });
    }

    formatMRR(amount: number): string {
        if (amount >= 1000000) {
            return '$' + (amount / 1000000).toFixed(1) + 'M';
        }
        if (amount >= 1000) {
            return '$' + (amount / 1000).toFixed(0) + 'k';
        }
        return '$' + amount;
    }

    logout() {
        this.authService.logout();
    }
}
