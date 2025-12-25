import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@core/auth/auth.service';
import { SalesService } from '@core/services/sales.service';
import { IndustryMockDataService } from '@core/services/industry-mock.service';
import { environment } from '@env/environment';

interface DashboardStats {
  ventasHoy: number;
  transacciones: number;
  topProducto: string;
  stockBajo: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-content">
          <button class="btn-icon" routerLink="/pos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-title">
            <h1>Dashboard</h1>
            <span class="date">{{ currentDate }}</span>
          </div>
        </div>
        <div class="header-user">
          <span class="user-name">{{ userName() }}</span>
          <div class="user-avatar">{{ userInitials() }}</div>
        </div>
      </header>

      <!-- Welcome Section -->
      <section class="welcome-section">
        <div class="welcome-card">
          <div class="welcome-content">
            <h2>¡Buen día, {{ userName() }}!</h2>
            <p>{{ tenantName() }}</p>
          </div>
          <div class="welcome-icon">👋</div>
        </div>
      </section>

      <!-- Stats Grid -->
      <section class="stats-section">
        <h3 class="section-title">Resumen del día</h3>
        <div class="stats-grid">
          <div class="stat-card sales">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <span class="stat-value">{{ formatPrice(stats().ventasHoy) }}</span>
              <span class="stat-label">Ventas hoy</span>
            </div>
            <div class="stat-trend up">+12%</div>
          </div>
          
          <div class="stat-card transactions">
            <div class="stat-icon">🧾</div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().transacciones }}</span>
              <span class="stat-label">Transacciones</span>
            </div>
          </div>
          
          <div class="stat-card products">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().topProducto || '--' }}</span>
              <span class="stat-label">Más vendido</span>
            </div>
          </div>
          
          <div class="stat-card alerts">
            <div class="stat-icon">⚠️</div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().stockBajo }}</span>
              <span class="stat-label">Stock bajo</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="actions-section">
        <h3 class="section-title">Acciones rápidas</h3>
        <div class="actions-grid">
          <button class="action-card" routerLink="/pos">
            <div class="action-icon">🛒</div>
            <span>Nueva Venta</span>
          </button>
          <button class="action-card" routerLink="/catalog">
            <div class="action-icon">📦</div>
            <span>Catálogo</span>
          </button>
          <button class="action-card" routerLink="/inventory">
            <div class="action-icon">📋</div>
            <span>Inventario</span>
          </button>
          <button class="action-card" routerLink="/reports">
            <div class="action-icon">📊</div>
            <span>Reportes</span>
          </button>
        </div>
      </section>

      <!-- Modules Navigation -->
      <section class="modules-section">
        <h3 class="section-title">🚀 Módulos</h3>
        <div class="modules-grid">
          <button class="module-card loyalty" routerLink="/loyalty">
            <div class="module-icon">🎁</div>
            <div class="module-info">
              <span class="module-name">Lealtad</span>
              <span class="module-desc">Puntos y recompensas</span>
            </div>
          </button>
          <button class="module-card kds" routerLink="/kds">
            <div class="module-icon">🍳</div>
            <div class="module-info">
              <span class="module-name">Cocina (KDS)</span>
              <span class="module-desc">Gestión de pedidos</span>
            </div>
          </button>
          <button class="module-card whatsapp" routerLink="/whatsapp">
            <div class="module-icon">💬</div>
            <div class="module-info">
              <span class="module-name">WhatsApp</span>
              <span class="module-desc">Notificaciones y pedidos</span>
            </div>
          </button>
          <button class="module-card reservations" routerLink="/reservations">
            <div class="module-icon">📅</div>
            <div class="module-info">
              <span class="module-name">Reservas</span>
              <span class="module-desc">Mesas y citas</span>
            </div>
          </button>
          <button class="module-card subscriptions" routerLink="/subscriptions">
            <div class="module-icon">🔄</div>
            <div class="module-info">
              <span class="module-name">Suscripciones</span>
              <span class="module-desc">Pedidos recurrentes</span>
            </div>
          </button>
          <button class="module-card earnings" routerLink="/earnings">
            <div class="module-icon">💰</div>
            <div class="module-info">
              <span class="module-name">Ganancias</span>
              <span class="module-desc">Calendario de ventas</span>
            </div>
          </button>
          <button class="module-card facturacion" routerLink="/facturacion">
            <div class="module-icon">🧾</div>
            <div class="module-info">
              <span class="module-name">Facturación</span>
              <span class="module-desc">DTE electrónico</span>
            </div>
          </button>
          <button class="module-card menu" routerLink="/menu-generator">
            <div class="module-icon">🖼️</div>
            <div class="module-info">
              <span class="module-name">Menú Digital</span>
              <span class="module-desc">Generador de menús</span>
            </div>
          </button>
        </div>
      </section>

      <!-- Pending Sales for Approval -->
      @if (pendingSales().length > 0) {
        <section class="pending-section">
          <h3 class="section-title">🔔 Ventas Pendientes ({{ pendingSales().length }})</h3>
          <div class="pending-list">
            @for (sale of pendingSales(); track sale.id) {
              <div class="pending-card">
                <div class="pending-info">
                  <span class="pending-number">{{ sale.numero }}</span>
                  <span class="pending-time">{{ sale.hora }}</span>
                </div>
                <div class="pending-amount">{{ formatPrice(sale.total) }}</div>
                <div class="pending-actions">
                  <button class="btn-approve" (click)="approveSale(sale)">✓ Aprobar</button>
                  <button class="btn-reject" (click)="rejectSale(sale)">✗ Rechazar</button>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- Top Products Chart -->
      <section class="products-section">
        <h3 class="section-title">🏆 Productos Más Vendidos</h3>
        <div class="top-products-list">
          @for (product of topProducts(); track product.nombre; let i = $index) {
            <div class="top-product-card">
              <span class="product-rank">{{ i + 1 }}</span>
              <div class="product-info">
                <span class="product-name">{{ product.nombre }}</span>
                <span class="product-count">{{ product.cantidad }} vendidos</span>
              </div>
              <div class="product-bar" [style.width.%]="(product.cantidad / 50) * 100"></div>
              <span class="product-total">{{ formatPrice(product.total) }}</span>
            </div>
          }
        </div>
      </section>

      <!-- Recent Activity -->
      <section class="activity-section">
        <h3 class="section-title">Actividad reciente</h3>
        <div class="activity-list">
          @for (activity of recentActivity(); track activity.id) {
            <div class="activity-item">
              <div class="activity-icon">{{ activity.icon }}</div>
              <div class="activity-info">
                <span class="activity-title">{{ activity.title }}</span>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
              <span class="activity-amount" [class.positive]="activity.amount > 0">
                {{ activity.amount > 0 ? '+' : '' }}{{ formatPrice(activity.amount) }}
              </span>
            </div>
          }
          
          @if (recentActivity().length === 0) {
            <div class="empty-activity">
              <span>Sin actividad reciente</span>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding-bottom: 2rem;
    }

    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-icon {
      width: 40px;
      height: 40px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      background: transparent;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      svg { width: 20px; height: 20px; }
      
      &:hover { background: rgba(255, 255, 255, 0.1); }
    }

    .header-title {
      h1 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 700;
      }
      .date {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .header-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-name {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .welcome-section {
      padding: 1.5rem;
    }

    .welcome-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 16px;
    }

    .welcome-content {
      h2 {
        margin: 0 0 0.25rem;
        font-size: 1.25rem;
        font-weight: 600;
      }
      p {
        margin: 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
      }
    }

    .welcome-icon {
      font-size: 2.5rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      margin: 0 0 1rem;
    }

    .stats-section {
      padding: 0 1.5rem 1.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      position: relative;
      overflow: hidden;
    }

    .stat-icon {
      font-size: 1.75rem;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #10B981;
    }

    .stat-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .stat-trend {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
      
      &.up {
        background: rgba(16, 185, 129, 0.15);
        color: #10B981;
      }
      
      &.down {
        background: rgba(239, 68, 68, 0.15);
        color: #EF4444;
      }
    }

    .actions-section {
      padding: 0 1.5rem 1.5rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      color: white;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        background: rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.3);
        transform: translateY(-2px);
      }
    }

    .action-icon {
      font-size: 1.5rem;
    }

    /* Modules Section */
    .modules-section {
      padding: 0 1.5rem 1.5rem;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }

    .module-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      color: white;
      cursor: pointer;
      transition: all 0.25s ease;
      position: relative;
      overflow: hidden;
    }

    .module-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent, transparent);
      transition: all 0.3s;
      opacity: 0;
    }

    .module-card:hover::before {
      opacity: 1;
    }

    .module-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .module-card.loyalty::before { background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), transparent); }
    .module-card.loyalty:hover { border-color: #EC4899; }
    
    .module-card.kds::before { background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), transparent); }
    .module-card.kds:hover { border-color: #F59E0B; }
    
    .module-card.whatsapp::before { background: linear-gradient(135deg, rgba(37, 211, 102, 0.15), transparent); }
    .module-card.whatsapp:hover { border-color: #25D366; }
    
    .module-card.reservations::before { background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), transparent); }
    .module-card.reservations:hover { border-color: #6366F1; }
    
    .module-card.subscriptions::before { background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), transparent); }
    .module-card.subscriptions:hover { border-color: #3B82F6; }
    
    .module-card.earnings::before { background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), transparent); }
    .module-card.earnings:hover { border-color: #10B981; }
    
    .module-card.facturacion::before { background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), transparent); }
    .module-card.facturacion:hover { border-color: #8B5CF6; }
    
    .module-card.menu::before { background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), transparent); }
    .module-card.menu:hover { border-color: #0EA5E9; }

    .module-icon {
      font-size: 2rem;
      z-index: 1;
    }

    .module-info {
      display: flex;
      flex-direction: column;
      z-index: 1;
    }

    .module-name {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .module-desc {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .activity-section {
      padding: 0 1.5rem;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(99, 102, 241, 0.15);
      border-radius: 10px;
      font-size: 1.25rem;
    }

    .activity-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .activity-title {
      font-size: 0.9rem;
      font-weight: 500;
    }

    .activity-time {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
    }

    .activity-amount {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.7);
      
      &.positive {
        color: #10B981;
      }
    }

    /* Pending Sales Section */
    .pending-section, .products-section {
      padding: 0 1.5rem 1.5rem;
    }

    .pending-list, .top-products-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .pending-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 12px;
    }

    .pending-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .pending-number {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .pending-time {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .pending-amount {
      font-weight: 700;
      font-size: 1.25rem;
      color: #f59e0b;
    }

    .pending-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-approve {
      padding: 0.5rem 0.75rem;
      background: linear-gradient(135deg, #10B981, #059669);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      
      &:hover { opacity: 0.9; }
    }

    .btn-reject {
      padding: 0.5rem 0.75rem;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.5);
      border-radius: 8px;
      color: #EF4444;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      
      &:hover { background: rgba(239, 68, 68, 0.25); }
    }

    /* Top Products */
    .top-product-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      position: relative;
      overflow: hidden;
    }

    .product-rank {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 50%;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      z-index: 1;
    }

    .product-name {
      font-weight: 500;
    }

    .product-count {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .product-bar {
      position: absolute;
      left: 0;
      bottom: 0;
      height: 3px;
      background: linear-gradient(90deg, #6366F1, #8B5CF6);
      border-radius: 0 4px 4px 0;
    }

    .product-total {
      font-weight: 600;
      color: #10B981;
      z-index: 1;
    }

    .empty-activity {
      text-align: center;
      padding: 2rem;
      color: rgba(255, 255, 255, 0.4);
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private salesService = inject(SalesService);
  private industryMockService = inject(IndustryMockDataService);
  private http = inject(HttpClient);

  stats = signal<DashboardStats>({
    ventasHoy: 0,
    transacciones: 0,
    topProducto: '',
    stockBajo: 0
  });

  pendingSales = signal<any[]>([]);
  recentActivity = signal<any[]>([]);
  topProducts = signal<{ nombre: string, cantidad: number, total: number }[]>([]);
  tenantLogo = signal<string>('');

  currentDate = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  userName = () => this.authService.user()?.nombre || 'Usuario';
  tenantName = () => this.authService.tenant()?.nombre || 'Mi Negocio';
  userInitials = () => {
    const name = this.userName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  ngOnInit() {
    this.loadData();
    this.loadTenantLogo();
  }

  async loadData() {
    // Load dashboard stats from API
    this.salesService.getDashboardStats().subscribe({
      next: (data) => {
        if (data) {
          this.stats.set({
            ventasHoy: data.ventasHoy || 0,
            transacciones: data.transacciones || 0,
            topProducto: data.topProducto || '--',
            stockBajo: data.stockBajo || 0
          });
        }
      },
      error: (err) => {
        console.error('Error loading dashboard stats', err);
        this.stats.set({
          ventasHoy: 0,
          transacciones: 0,
          topProducto: '--',
          stockBajo: 0
        });
      }
    });

    // Load pending sales from API
    this.salesService.getPendingSales().subscribe({
      next: (sales: any[]) => {
        const formatted = sales.map(s => ({
          id: s.id,
          numero: `#${s.numero}`,
          total: s.total,
          cliente: s.clienteNombre || 'Cliente',
          estado: s.estado,
          hora: new Date(s.fechaVenta).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        }));
        this.pendingSales.set(formatted);
      },
      error: () => this.pendingSales.set([])
    });

    // Load daily stats for top products
    this.salesService.getDailyStats().subscribe({
      next: (stats: any) => {
        if (stats?.topProductos?.length) {
          this.topProducts.set(stats.topProductos.map((p: any) => ({
            nombre: p.nombre,
            cantidad: p.cantidad,
            total: p.total
          })));
        } else {
          this.topProducts.set([]);
        }

        // Set recent activity from actual sales data
        if (stats?.ventasRecientes?.length) {
          this.recentActivity.set(stats.ventasRecientes.map((s: any, i: number) => ({
            id: i + 1,
            icon: '🧾',
            title: `Venta #${s.numero}`,
            time: this.formatTimeAgo(s.fechaVenta),
            amount: s.total
          })));
        }
      },
      error: () => this.topProducts.set([])
    });
  }

  loadTenantLogo() {
    // Set logo based on tenant name
    const tenantName = this.tenantName().toLowerCase();
    if (tenantName.includes('trigal')) {
      this.tenantLogo.set('/assets/logos/eltrigal.png');
    } else if (tenantName.includes('pedro')) {
      this.tenantLogo.set('/assets/logos/donpedro.png');
    }
  }

  loadMockData() {
    const mockData = this.industryMockService.getMockDashboardData();
    this.stats.set({
      ventasHoy: mockData.ventasHoy,
      transacciones: mockData.transacciones,
      topProducto: mockData.topProducto,
      stockBajo: 3
    });

    this.recentActivity.set([
      { id: 1, icon: '🧾', title: 'Venta #0023', time: 'Hace 5 min', amount: 4500 },
      { id: 2, icon: '🧾', title: 'Venta #0022', time: 'Hace 15 min', amount: 12800 },
      { id: 3, icon: '📦', title: 'Stock actualizado', time: 'Hace 1 hora', amount: 0 },
    ]);
  }

  approveSale(sale: any) {
    sale.estado = 'APROBADA';
    this.pendingSales.update(sales => sales.filter(s => s.id !== sale.id));
    // Add to recent activity
    this.recentActivity.update(activity => [
      { id: Date.now(), icon: '✅', title: `Venta ${sale.numero} aprobada`, time: 'Ahora', amount: sale.total },
      ...activity
    ]);
  }

  rejectSale(sale: any) {
    sale.estado = 'RECHAZADA';
    this.pendingSales.update(sales => sales.filter(s => s.id !== sale.id));
    this.recentActivity.update(activity => [
      { id: Date.now(), icon: '❌', title: `Venta ${sale.numero} rechazada`, time: 'Ahora', amount: -sale.total },
      ...activity
    ]);
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-CL');
  }

  openReports() {
    console.log('Open reports');
  }

  openSettings() {
    console.log('Open settings');
  }
}
