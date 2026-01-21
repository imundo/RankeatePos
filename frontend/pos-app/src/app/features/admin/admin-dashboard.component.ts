import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminService, AdminTenant, AdminUser } from '../../core/services/admin.service';

interface StatCard {
  label: string;
  value: number;
  trend?: number;
  icon: string;
  gradient: string;
  suffix?: string;
  prefix?: string;
}

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="title-section">
            <span class="crown">👑</span>
            <div>
              <h1>SmartPos Admin</h1>
              <p class="subtitle">Panel de control de la plataforma</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn-primary" (click)="navigateTo('/admin/tenants/new')">
              <span>🚀</span> Nuevo Cliente
            </button>
          </div>
        </div>
      </header>

      <!-- Stats Grid -->
      <section class="stats-section">
        <div class="stats-grid">
          @for (stat of stats(); track stat.label; let i = $index) {
            <div class="stat-card" [style.--delay]="i * 100 + 'ms'" 
                 [style.background]="stat.gradient">
              <div class="stat-icon">{{ stat.icon }}</div>
              <div class="stat-content">
                <span class="stat-value" [class.counting]="isAnimating()">
                  {{ stat.prefix || '' }}{{ animatedValues()[i] | number }}{{ stat.suffix || '' }}
                </span>
                <span class="stat-label">{{ stat.label }}</span>
                @if (stat.trend) {
                  <span class="stat-trend" [class.positive]="stat.trend > 0" [class.negative]="stat.trend < 0">
                    {{ stat.trend > 0 ? '↑' : '↓' }} {{ stat.trend | number:'1.1-1' }}%
                  </span>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="actions-section">
        <h2 class="section-title">
          <span>⚡</span> Acciones Rápidas
        </h2>
        <div class="actions-grid">
          @for (action of quickActions; track action.route) {
            <div class="action-card" (click)="navigateTo(action.route)" [style.--accent]="action.color">
              <div class="action-icon">{{ action.icon }}</div>
              <div class="action-content">
                <span class="action-label">{{ action.label }}</span>
                <span class="action-desc">{{ action.description }}</span>
              </div>
              @if (action.badge) {
                <span class="action-badge">{{ action.badge }}</span>
              }
            </div>
          }
        </div>
      </section>

      <!-- Recent Activity -->
      <section class="activity-section">
        <h2 class="section-title">
          <span>📊</span> Actividad Reciente
        </h2>
        <div class="activity-list">
          @for (tenant of recentTenants(); track tenant.id; let i = $index) {
            <div class="activity-item" [style.--delay]="i * 50 + 'ms'">
              <div class="activity-avatar" [style.background]="getAvatarColor(tenant.businessType)">
                {{ tenant.razonSocial.charAt(0).toUpperCase() }}
              </div>
              <div class="activity-content">
                <span class="activity-name">{{ tenant.razonSocial }}</span>
                <span class="activity-meta">{{ tenant.businessType }} • {{ tenant.plan }}</span>
              </div>
              <div class="activity-actions">
                <button class="btn-icon" (click)="navigateTo('/admin/tenants/' + tenant.id + '/users'); $event.stopPropagation()" title="Usuarios">
                  👥
                </button>
                <button class="btn-icon" (click)="navigateTo('/admin/tenants/' + tenant.id + '/edit'); $event.stopPropagation()" title="Editar">
                  ✏️
                </button>
              </div>
              <span class="activity-status" [class.active]="tenant.activo" [class.inactive]="!tenant.activo">
                {{ tenant.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          }
          @if (recentTenants().length === 0) {
            <div class="empty-state">
              <span class="empty-icon">🏢</span>
              <p>No hay clientes registrados aún</p>
              <button class="btn-secondary" (click)="navigateTo('/admin/tenants/new')">Crear primer cliente</button>
            </div>
          }
        </div>
      </section>

      <!-- System Status -->
      <section class="status-section">
        <div class="status-grid">
          <div class="status-card healthy">
            <span class="status-indicator"></span>
            <span class="status-label">Auth Service</span>
            <span class="status-value">Operativo</span>
          </div>
          <div class="status-card healthy">
            <span class="status-indicator"></span>
            <span class="status-label">Operations</span>
            <span class="status-value">Operativo</span>
          </div>
          <div class="status-card healthy">
            <span class="status-indicator"></span>
            <span class="status-label">Database</span>
            <span class="status-value">Conectado</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a1a 0%, #12122a 50%, #1a1a3a 100%);
      color: white;
    }

    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    /* Header */
    .dashboard-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .crown {
      font-size: 2.5rem;
      filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(90deg, #fff, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      margin: 0;
      color: rgba(255,255,255,0.6);
      font-size: 0.9rem;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    }

    /* Stats Section */
    .stats-section {
      margin-bottom: 2.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .stat-card {
      padding: 1.5rem;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 1rem;
      animation: slideIn 0.5s ease forwards;
      animation-delay: var(--delay);
      opacity: 0;
      transform: translateY(20px);
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      z-index: -1;
    }

    @keyframes slideIn {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .stat-icon {
      font-size: 2.5rem;
      filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
    }

    .stat-value.counting {
      animation: countPulse 0.3s ease;
    }

    @keyframes countPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .stat-label {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.8);
      margin-top: 0.25rem;
    }

    .stat-trend {
      font-size: 0.75rem;
      margin-top: 0.25rem;
      padding: 0.15rem 0.5rem;
      border-radius: 20px;
      width: fit-content;
    }

    .stat-trend.positive {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }

    .stat-trend.negative {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    /* Actions Section */
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: rgba(255,255,255,0.9);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-card {
      padding: 1.25rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 1rem;
      position: relative;
    }

    .action-card:hover {
      background: rgba(255,255,255,0.06);
      border-color: var(--accent);
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .action-icon {
      font-size: 1.75rem;
    }

    .action-content {
      display: flex;
      flex-direction: column;
    }

    .action-label {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .action-desc {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.5);
    }

    .action-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 20px;
    }

    /* Activity Section */
    .activity-section {
      margin: 2.5rem 0;
    }

    .activity-list {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      overflow: hidden;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      animation: fadeIn 0.4s ease forwards;
      animation-delay: var(--delay);
      opacity: 0;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    @keyframes fadeIn {
      to { opacity: 1; }
    }

    .activity-avatar {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-name {
      display: block;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .activity-meta {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.5);
    }

    .activity-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      background: rgba(255,255,255,0.1);
      transform: scale(1.1);
    }

    .activity-status {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
    }

    .activity-status.active {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }

    .activity-status.inactive {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: rgba(255,255,255,0.5);
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .btn-secondary {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 10px;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: rgba(255,255,255,0.15);
    }

    /* Status Section */
    .status-section {
      margin-top: 2rem;
    }

    .status-grid {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .status-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      flex: 1;
      min-width: 180px;
    }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .status-card.healthy .status-indicator {
      background: #10b981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .status-label {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.7);
    }

    .status-value {
      margin-left: auto;
      font-size: 0.8rem;
      color: #10b981;
      font-weight: 600;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      h1 {
        font-size: 1.4rem;
      }

      .crown {
        font-size: 2rem;
      }

      .stats-grid {
        display: flex;
        overflow-x: auto;
        gap: 1rem;
        padding-bottom: 0.5rem;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }

      .stats-grid::-webkit-scrollbar {
        display: none;
      }

      .stat-card {
        min-width: 180px;
        flex-shrink: 0;
        scroll-snap-align: start;
      }

      .actions-grid {
        display: flex;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        scroll-snap-type: x mandatory;
      }

      .actions-grid::-webkit-scrollbar {
        display: none;
      }

      .action-card {
        min-width: 160px;
        flex-shrink: 0;
        scroll-snap-align: start;
      }

      .activity-item {
        flex-wrap: wrap;
      }

      .activity-actions {
        order: 3;
        width: 100%;
        justify-content: flex-end;
        margin-top: 0.5rem;
      }

      .status-grid {
        flex-direction: column;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);

  stats = signal<StatCard[]>([
    { label: 'Total Clientes', value: 0, trend: 12.5, icon: '🏢', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', suffix: '' },
    { label: 'Activos', value: 0, trend: 8.2, icon: '✅', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', suffix: '' },
    { label: 'Usuarios', value: 0, trend: 15.3, icon: '👥', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', suffix: '' },
    { label: 'MRR', value: 0, trend: 22.1, icon: '💰', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', prefix: '$' }
  ]);

  animatedValues = signal<number[]>([0, 0, 0, 0]);
  isAnimating = signal(false);
  recentTenants = signal<AdminTenant[]>([]);
  loading = signal(true);

  quickActions: QuickAction[] = [
    { label: 'Ver Clientes', description: 'Gestionar todos los clientes', icon: '🏢', route: '/admin/tenants', color: '#6366f1' },
    { label: 'Nuevo Cliente', description: 'Crear con wizard paso a paso', icon: '🚀', route: '/admin/tenants/new', color: '#8b5cf6' },
    { label: 'Planes', description: 'Configurar membresías', icon: '💳', route: '/admin/plans', color: '#10b981' },
    { label: 'Roles', description: 'Gestionar roles y permisos', icon: '🔐', route: '/admin/roles', color: '#ef4444' },
    { label: 'Auditoría', description: 'Registro de actividad', icon: '📋', route: '/admin/audit-logs', color: '#06b6d4' },
    { label: 'Sucursales', description: 'Gestionar ubicaciones', icon: '📍', route: '/admin/branches', color: '#3b82f6' },
    { label: 'Módulos', description: 'Gestión de funcionalidades', icon: '📊', route: '/admin/modules', color: '#f59e0b' },
    { label: 'Industrias', description: 'Tipos de negocio', icon: '🏪', route: '/admin/industries', color: '#ec4899' }
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    // Load Stats
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        const newStats = [
          { ...this.stats()[0], value: stats.totalTenants },
          { ...this.stats()[1], value: stats.activeTenants },
          { ...this.stats()[2], value: stats.totalUsers },
          { ...this.stats()[3], value: stats.mrr }
        ];
        this.stats.set(newStats);
        this.animateCounters(newStats);
        this.loading.set(false);
      },
      error: (err) => console.error('Error loading stats:', err)
    });

    // Load Recent Tenants (Activity)
    this.adminService.getTenants().subscribe({
      next: (tenants) => {
        this.recentTenants.set(tenants.slice(0, 5));
      }
    });

    // Load System Health (Optional, currently mocked in UI but let's try to fetch if we had it)
    // For now we keep the UI as is or we can wire it if we added getSystemHealth to admin.service
  }

  animateCounters(stats: StatCard[]) {
    this.isAnimating.set(true);
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      const animated = stats.map(s => Math.round(s.value * eased));
      this.animatedValues.set(animated);

      if (currentStep >= steps) {
        clearInterval(interval);
        this.isAnimating.set(false);
      }
    }, stepDuration);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  getAvatarColor(businessType: string): string {
    const colors: Record<string, string> = {
      'RETAIL': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'FOOD': 'linear-gradient(135deg, #f59e0b, #d97706)',
      'PANADERIA': 'linear-gradient(135deg, #f59e0b, #d97706)',
      'RESTAURANT': 'linear-gradient(135deg, #ef4444, #dc2626)',
      'SERVICE': 'linear-gradient(135deg, #10b981, #059669)',
      'EDUCATION': 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      'EDITORIAL': 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      'CURSOS': 'linear-gradient(135deg, #ec4899, #db2777)'
    };
    return colors[businessType] || 'linear-gradient(135deg, #6b7280, #4b5563)';
  }
}
