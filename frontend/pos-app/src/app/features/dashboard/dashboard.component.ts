import { Component, inject, signal, computed, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { SalesService } from '@core/services/sales.service';
import { SalesEventService, ActivityEvent } from '@core/services/sales-event.service';
import { UserPreferencesService, ModuleInfo } from '@core/services/user-preferences.service';
import { OfflineService } from '@core/offline/offline.service';
import { environment } from '@env/environment';
import { BranchSwitcherComponent } from '@shared/components/branch-switcher/branch-switcher.component';
import { StockAlertsWidgetComponent } from './components/stock-alerts-widget.component';

interface DashboardStats {
  ventasHoy: number;
  transacciones: number;
  topProducto: string;
  stockBajo: number;
  promedioTicket?: number;
}

interface StatCard {
  key: string;
  icon: string;
  value: string | number;
  label: string;
  trend?: number;
  theme: string;
  justUpdated: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BranchSwitcherComponent, StockAlertsWidgetComponent],
  template: `
    <div class="dashboard-mobile">
      <!-- Compact Mobile Header -->
      <header class="dashboard-header-mobile">
        <div class="header-left">
          <button class="btn-icon-mobile" routerLink="/pos" aria-label="Ir al POS">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        </div>
        <div class="header-center">
          <h1>Dashboard</h1>
          <span class="date">{{ currentDate }}</span>
        </div>
        <div class="user-avatar-mobile" (click)="openUserMenu()">
          {{ userInitials() }}
        </div>
      </header>

      <!-- Welcome Banner -->
      <section class="welcome-banner-mobile" [class.collapsed]="isScrolled()">
        <div class="welcome-content">
          <h2>¡Hola, {{ userName() }}!</h2>
          <p class="sync-status">
            <span class="status-dot" [class.online]="isOnline()"></span>
            {{ isOnline() ? 'Sincronizado' : 'Sin conexión' }}
          </p>
          <div class="mt-2">
            <app-branch-switcher></app-branch-switcher>
          </div>
        </div>
        <div class="welcome-icon">👋</div>
      </section>

      <!-- Stats Section - Horizontal Scroll on Mobile -->
      <section class="dashboard-section">
        <div class="section-header-mobile">
          <h3>📈 Resumen del día</h3>
          <span class="last-update" *ngIf="lastUpdateTime()">
            {{ lastUpdateTime() }}
          </span>
        </div>
        <div class="swipe-container">
          @for (stat of statCards(); track stat.key) {
            <div class="stat-card-mobile" [class]="stat.theme">
              <div class="stat-icon">{{ stat.icon }}</div>
              <span class="stat-value" [class.pulse]="stat.justUpdated">
                {{ stat.value }}
              </span>
              <span class="stat-label">{{ stat.label }}</span>
              @if (stat.trend !== undefined && stat.trend !== 0) {
                <span class="stat-trend" [class.up]="stat.trend > 0" [class.down]="stat.trend < 0">
                  {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
                </span>
              }
            </div>
          }
        </div>
      </section>

      <!-- Stock Alerts Widget -->
      <app-stock-alerts-widget></app-stock-alerts-widget>

      <!-- Quick Actions -->
      <section class="dashboard-section">
        <div class="section-header-mobile">
          <h3>⚡ Acciones rápidas</h3>
        </div>
        <div class="quick-actions-grid">
          @for (action of quickActions(); track action.route) {
            <a class="quick-action-btn" [routerLink]="action.route" (click)="recordAction(action.id)">
              <span class="action-icon">{{ action.icon }}</span>
              <span class="action-label">{{ action.label }}</span>
            </a>
          }
        </div>
      </section>

      <!-- Favorite Modules -->
      <section class="dashboard-section">
        <div class="section-header-mobile">
          <h3>🚀 Tus módulos</h3>
          <button class="btn-text" (click)="openModuleSettings()">
            Personalizar
          </button>
        </div>
        <div class="module-grid-mobile">
          @for (module of displayModules(); track module.id) {
            <a class="module-card-mobile" 
               [routerLink]="module.route"
               (click)="recordModuleUsage(module.id)">
              <span class="module-icon">{{ module.icon }}</span>
              <span class="module-name">{{ module.name }}</span>
              @if (module.badge) {
                <span class="module-badge">{{ module.badge }}</span>
              }
            </a>
          }
          <!-- Add Module Button -->
          <button class="module-card-mobile add-module" (click)="openModuleSettings()">
            <span class="module-icon">➕</span>
            <span class="module-name">Agregar</span>
          </button>
        </div>
      </section>

      <!-- Pending Sales Alert -->
      @if (pendingSales().length > 0) {
        <section class="dashboard-section pending-alert">
          <div class="section-header-mobile">
            <h3>🔔 Pendientes ({{ pendingSales().length }})</h3>
          </div>
          <div class="activity-list-mobile">
            @for (sale of pendingSales().slice(0, 3); track sale.id) {
              <div class="activity-item-mobile pending">
                <div class="activity-icon">⏳</div>
                <div class="activity-content">
                  <span class="activity-title">{{ sale.numero }}</span>
                  <span class="activity-time">{{ sale.hora }}</span>
                </div>
                <span class="activity-amount">{{ formatPrice(sale.total) }}</span>
                <div class="pending-actions">
                  <button class="btn-approve" (click)="approveSale(sale)">✓</button>
                  <button class="btn-reject" (click)="rejectSale(sale)">✗</button>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- Activity Feed -->
      <section class="dashboard-section">
        <div class="section-header-mobile">
          <h3>📊 Actividad reciente</h3>
          <div class="activity-filters">
            <button [class.active]="activityFilter() === 'all'" 
                    (click)="setActivityFilter('all')">Todo</button>
            <button [class.active]="activityFilter() === 'ventas'" 
                    (click)="setActivityFilter('ventas')">Ventas</button>
            <button [class.active]="activityFilter() === 'stock'" 
                    (click)="setActivityFilter('stock')">Stock</button>
          </div>
        </div>
        
        <div class="activity-list-mobile">
          @for (activity of filteredActivity(); track activity.id) {
            <div class="activity-item-mobile">
              <div class="activity-icon">{{ activity.icon }}</div>
              <div class="activity-content">
                <span class="activity-title">{{ activity.title }}</span>
                <span class="activity-time">{{ formatTimeAgo(activity.timestamp) }}</span>
              </div>
              @if (activity.amount !== 0) {
                <span class="activity-amount" 
                      [class.positive]="activity.amount > 0"
                      [class.negative]="activity.amount < 0">
                  {{ activity.amount > 0 ? '+' : '' }}{{ formatPrice(activity.amount) }}
                </span>
              }
            </div>
          } @empty {
            <div class="empty-state-mobile">
              <span class="empty-icon">📭</span>
              <p>Las actividades aparecerán aquí cuando realices operaciones</p>
            </div>
          }
        </div>
      </section>

      <!-- Top Products -->
      @if (topProducts().length > 0) {
        <section class="dashboard-section">
          <div class="section-header-mobile">
            <h3>🏆 Más vendidos hoy</h3>
          </div>
          <div class="activity-list-mobile">
            @for (product of topProducts().slice(0, 5); track product.nombre; let i = $index) {
              <div class="activity-item-mobile">
                <div class="activity-icon rank">{{ i + 1 }}</div>
                <div class="activity-content">
                  <span class="activity-title">{{ product.nombre }}</span>
                  <span class="activity-time">{{ product.cantidad }} vendidos</span>
                </div>
                <span class="activity-amount positive">{{ formatPrice(product.total) }}</span>
              </div>
            }
          </div>
        </section>
      }
    </div>

    <!-- Mobile Bottom Navigation -->
    <nav class="mobile-bottom-nav">
      <a routerLink="/pos" class="nav-item">
        <span class="nav-icon">🛒</span>
        <span class="nav-label">POS</span>
      </a>
      <a routerLink="/dashboard" class="nav-item active">
        <span class="nav-icon">📊</span>
        <span class="nav-label">Dashboard</span>
      </a>
      <a routerLink="/catalog" class="nav-item">
        <span class="nav-icon">📦</span>
        <span class="nav-label">Catálogo</span>
      </a>
      <a routerLink="/inventory" class="nav-item">
        <span class="nav-icon">📋</span>
        <span class="nav-label">Stock</span>
      </a>
      <a routerLink="/earnings" class="nav-item">
        <span class="nav-icon">💰</span>
        <span class="nav-label">Ganancias</span>
      </a>
    </nav>

    <!-- Module Settings Modal -->
    @if (showModuleSettings()) {
      <div class="modal-overlay" (click)="closeModuleSettings()">
        <div class="modal-content module-settings-modal" (click)="$event.stopPropagation()">
          <h2>Personalizar módulos</h2>
          <p style="color: rgba(255,255,255,0.6); margin-bottom: 1rem; font-size: 0.9rem;">
            Selecciona tus módulos favoritos para acceso rápido
          </p>
          <div class="modules-list">
            @for (module of allModules(); track module.id) {
              <div class="module-item" (click)="toggleFavorite(module.id)">
                <span class="module-icon">{{ module.icon }}</span>
                <div class="module-info">
                  <span class="module-name">{{ module.name }}</span>
                  <span class="module-desc">{{ module.description }}</span>
                </div>
                <button class="favorite-toggle" 
                        [class.active]="isFavorite(module.id)"
                        (click)="toggleFavorite(module.id); $event.stopPropagation()">
                  {{ isFavorite(module.id) ? '⭐' : '☆' }}
                </button>
              </div>
            }
          </div>
          <div class="form-actions" style="margin-top: 1.5rem;">
            <button class="btn btn-primary" (click)="closeModuleSettings()">
              Guardar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* Component-specific overrides */
    .pending-alert .activity-item-mobile {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.3);
    }
    
    .pending-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .btn-approve, .btn-reject {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-approve {
      background: linear-gradient(135deg, #10B981, #059669);
      color: white;
    }
    
    .btn-reject {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.5);
      color: #EF4444;
    }
    
    .activity-icon.rank {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      font-weight: 700;
      font-size: 0.85rem;
    }
    
    .last-update {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.4);
    }

    /* Stats theme colors */
    .stat-card-mobile.sales .stat-value { color: #10B981; }
    .stat-card-mobile.transactions .stat-value { color: #6366F1; }
    .stat-card-mobile.products .stat-value { color: #F59E0B; }
    .stat-card-mobile.alerts .stat-value { color: #EF4444; }
    
    /* Module settings modal adjustments */
    .module-settings-modal {
      max-width: 500px;
      width: 90%;
    }
    
    .module-settings-modal h2 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private salesService = inject(SalesService);
  private salesEventService = inject(SalesEventService);
  private userPreferencesService = inject(UserPreferencesService);
  private offlineService = inject(OfflineService);
  private router = inject(Router);
  private http = inject(HttpClient);

  private subscriptions: Subscription[] = [];
  private refreshInterval: any;

  // Core state
  stats = signal<DashboardStats>({
    ventasHoy: 0,
    transacciones: 0,
    topProducto: '',
    stockBajo: 0
  });

  pendingSales = signal<any[]>([]);
  topProducts = signal<{ nombre: string; cantidad: number; total: number }[]>([]);
  activityFilter = signal<'all' | 'ventas' | 'stock' | 'pagos'>('all');
  showModuleSettings = signal(false);
  isScrolled = signal(false);
  lastUpdateTime = signal<string>('');

  // Computed stat cards for display
  statCards = computed<StatCard[]>(() => {
    const s = this.stats();
    return [
      {
        key: 'ventas',
        icon: '💰',
        value: this.formatPrice(s.ventasHoy),
        label: 'Ventas hoy',
        trend: 12, // TODO: Calculate from yesterday
        theme: 'sales',
        justUpdated: false
      },
      {
        key: 'transacciones',
        icon: '🧾',
        value: s.transacciones,
        label: 'Transacciones',
        theme: 'transactions',
        justUpdated: false
      },
      {
        key: 'topProducto',
        icon: '🏆',
        value: s.topProducto || '--',
        label: 'Más vendido',
        theme: 'products',
        justUpdated: false
      },
      {
        key: 'stockBajo',
        icon: '⚠️',
        value: s.stockBajo,
        label: 'Stock bajo',
        theme: 'alerts',
        justUpdated: false
      }
    ];
  });

  // Quick actions configuration
  quickActions = signal([
    { id: 'pos', icon: '🛒', label: 'Nueva Venta', route: '/pos' },
    { id: 'catalog', icon: '📦', label: 'Catálogo', route: '/catalog' },
    { id: 'inventory', icon: '📋', label: 'Inventario', route: '/inventory' },
    { id: 'reports', icon: '📊', label: 'Reportes', route: '/reports' }
  ]);

  // Modules from preferences service
  allModules = computed(() => this.userPreferencesService.getAllModules());

  displayModules = computed(() => {
    const favorites = this.userPreferencesService.getFavoriteModulesInfo();
    if (favorites.length >= 6) {
      return favorites.slice(0, 6);
    }
    // Fill with most used if not enough favorites
    const mostUsed = this.userPreferencesService.getMostUsedModules(6 - favorites.length);
    const result: ModuleInfo[] = [...favorites];
    for (const m of mostUsed) {
      if (!result.find(r => r.id === m.id)) {
        result.push(m);
        if (result.length >= 6) break;
      }
    }
    return result;
  });

  // Activity feed from event service
  recentActivity = signal<ActivityEvent[]>([]);

  filteredActivity = computed(() => {
    const filter = this.activityFilter();
    const activity = this.recentActivity();
    if (filter === 'all') return activity.slice(0, 10);
    return activity.filter(a => a.type === filter).slice(0, 10);
  });

  // Connection status
  isOnline = signal(navigator.onLine);

  // Date display
  currentDate = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // User info helpers
  userName = () => this.authService.user()?.nombre || 'Usuario';
  tenantName = () => this.authService.tenant()?.nombre || 'Mi Negocio';
  userInitials = () => {
    const name = this.userName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  @HostListener('window:online')
  onOnline() {
    this.isOnline.set(true);
  }

  @HostListener('window:offline')
  onOffline() {
    this.isOnline.set(false);
  }

  ngOnInit() {
    this.loadData();
    this.setupEventSubscriptions();
    this.startAutoRefresh();

    // Load activity filter from preferences
    const savedFilter = this.userPreferencesService.activityFilter();
    this.activityFilter.set(savedFilter);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private setupEventSubscriptions() {
    // Subscribe to sales updates
    this.subscriptions.push(
      this.salesEventService.salesUpdated$.subscribe(() => {
        this.loadData();
        this.updateLastUpdateTime();
      })
    );

    // Subscribe to activity feed
    this.subscriptions.push(
      this.salesEventService.activity$.subscribe(activities => {
        this.recentActivity.set(activities);
      })
    );

    // Subscribe to dashboard refresh triggers
    this.subscriptions.push(
      this.salesEventService.dashboardRefresh$.subscribe(() => {
        this.loadData();
      })
    );
  }

  private startAutoRefresh() {
    // Refresh every 15 seconds for more responsive updates
    this.refreshInterval = setInterval(() => {
      if (this.isOnline()) {
        this.loadData();
      }
    }, 15000);

    // Listen for cross-tab sync events (when POS makes a sale in another tab)
    window.addEventListener('storage', (event) => {
      if (event.key === 'pos_sale_completed' && event.newValue) {
        console.log('Dashboard: Sale detected from another tab, refreshing...');
        this.loadData();
      }
    });
  }

  private updateLastUpdateTime() {
    this.lastUpdateTime.set('Actualizado ' + new Date().toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    }));
  }

  async loadData() {
    // Debug: Check if we have valid authentication
    const tenantId = this.authService.getTenantId();
    console.log('Dashboard loadData - TenantId:', tenantId);

    if (!tenantId) {
      console.warn('Dashboard: No tenant ID available, skipping data load');
      return;
    }

    // Load dashboard stats
    this.salesService.getDashboardStats().subscribe({
      next: (data) => {
        console.log('Dashboard stats received:', data);
        if (data) {
          this.stats.set({
            ventasHoy: data.ventasHoy || 0,
            transacciones: data.transacciones || 0,
            topProducto: data.topProducto || '--',
            stockBajo: data.stockBajo || 0
          });
        }
        this.updateLastUpdateTime();
      },
      error: (err) => {
        console.error('Error loading dashboard stats', err);
      }
    });

    // Load pending sales
    this.salesService.getPendingSales().subscribe({
      next: (sales: any[]) => {
        const formatted = sales.map(s => ({
          id: s.id,
          numero: `#${s.numero}`,
          total: s.total,
          cliente: s.clienteNombre || 'Cliente',
          estado: s.estado,
          hora: new Date(s.fechaVenta).toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit'
          })
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

        // Add recent sales to activity feed
        if (stats?.ventasRecientes?.length) {
          stats.ventasRecientes.forEach((s: any) => {
            this.salesEventService.addActivity({
              id: `sale-${s.id || Date.now()}`,
              icon: '🧾',
              title: `Venta #${s.numero}`,
              timestamp: new Date(s.fechaVenta),
              amount: s.total,
              type: 'venta'
            });
          });
        }
      },
      error: () => this.topProducts.set([])
    });
  }

  // Module preference methods
  recordModuleUsage(moduleId: string) {
    this.userPreferencesService.recordModuleUsage(moduleId);
  }

  recordAction(actionId: string) {
    this.userPreferencesService.recordModuleUsage(actionId);
  }

  openModuleSettings() {
    this.showModuleSettings.set(true);
  }

  closeModuleSettings() {
    this.showModuleSettings.set(false);
  }

  toggleFavorite(moduleId: string) {
    this.userPreferencesService.toggleFavorite(moduleId);
  }

  isFavorite(moduleId: string): boolean {
    return this.userPreferencesService.isFavorite(moduleId);
  }

  // Activity filter
  setActivityFilter(filter: 'all' | 'ventas' | 'stock' | 'pagos') {
    this.activityFilter.set(filter);
    this.userPreferencesService.setActivityFilter(filter);
  }

  // Pending sales actions
  approveSale(sale: any) {
    this.salesService.approveSale(sale.id).subscribe({
      next: () => {
        this.pendingSales.update(sales => sales.filter(s => s.id !== sale.id));
        this.salesEventService.addActivity({
          id: `approve-${sale.id}`,
          icon: '✅',
          title: `Venta ${sale.numero} aprobada`,
          timestamp: new Date(),
          amount: sale.total,
          type: 'venta'
        });
        this.loadData(); // Refresh stats
      },
      error: (err) => console.error('Error approving sale', err)
    });
  }

  rejectSale(sale: any) {
    this.salesService.rejectSale(sale.id).subscribe({
      next: () => {
        this.pendingSales.update(sales => sales.filter(s => s.id !== sale.id));
        this.salesEventService.addActivity({
          id: `reject-${sale.id}`,
          icon: '❌',
          title: `Venta ${sale.numero} rechazada`,
          timestamp: new Date(),
          amount: -sale.total,
          type: 'venta'
        });
      },
      error: (err) => console.error('Error rejecting sale', err)
    });
  }

  openUserMenu() {
    this.router.navigate(['/settings']);
  }

  // Formatting helpers
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatTimeAgo(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return this.salesEventService.formatTimeAgo(d);
  }
}
