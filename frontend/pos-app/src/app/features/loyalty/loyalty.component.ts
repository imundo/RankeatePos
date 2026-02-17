import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { LoyaltyService, LoyaltyCustomer, LoyaltyTransaction, Reward } from '@core/services/loyalty.service';



@Component({
  selector: 'app-loyalty',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="loyalty-container">
      <!-- Header -->
      <header class="loyalty-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-btn">
            <span class="icon">←</span>
          </a>
          <div class="title-section">
            <h1>🎁 Programa de Lealtad</h1>
            <p class="subtitle">Gestiona puntos, recompensas y clientes frecuentes</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" (click)="showSettings = true">
            ⚙️ Configuración
          </button>
          <button class="action-btn primary" (click)="showAddCustomer = true">
            ➕ Nuevo Cliente
          </button>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card gradient-purple">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <span class="stat-value">{{ totalCustomers() }}</span>
            <span class="stat-label">Clientes Registrados</span>
          </div>
        </div>
        <div class="stat-card gradient-blue">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <span class="stat-value">{{ totalPuntosActivos() | number }}</span>
            <span class="stat-label">Puntos en Circulación</span>
          </div>
        </div>
        <div class="stat-card gradient-green">
          <div class="stat-icon">🎁</div>
          <div class="stat-content">
            <span class="stat-value">{{ rewardsCanjeados() }}</span>
            <span class="stat-label">Canjes este Mes</span>
          </div>
        </div>
        <div class="stat-card gradient-amber">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <span class="stat-value">{{ clientesPlatino() }}</span>
            <span class="stat-label">Clientes Platino</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'customers'"
          (click)="activeTab = 'customers'">
          👥 Clientes
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'rewards'"
          (click)="activeTab = 'rewards'">
          🎁 Recompensas
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'history'"
          (click)="activeTab = 'history'">
          📜 Historial
        </button>
      </div>

      <!-- Customers Tab -->
      @if (activeTab === 'customers') {
        <div class="customers-section">
          <div class="search-bar">
            <input 
              type="text" 
              placeholder="🔍 Buscar cliente por nombre, email o teléfono..."
              [(ngModel)]="searchQuery"
              class="search-input">
          </div>

          <div class="customers-grid">
            @for (customer of filteredCustomers(); track customer.id) {
              <div class="customer-card" [class]="'nivel-' + customer.nivel.toLowerCase()">
                <div class="customer-header">
                  <div class="customer-avatar">
                    {{ customer.nombre.charAt(0).toUpperCase() }}
                  </div>
                  <div class="customer-info">
                    <h3>{{ customer.nombre }}</h3>
                    <span class="nivel-badge">{{ getNivelIcon(customer.nivel) }} {{ customer.nivel }}</span>
                  </div>
                </div>
                <div class="customer-stats">
                  <div class="stat">
                    <span class="label">Puntos</span>
                    <span class="value">{{ customer.puntosActuales | number }}</span>
                  </div>
                  <div class="stat">
                    <span class="label">Total Compras</span>
                    <span class="value">{{ customer.puntosTotales | number }} totales</span>
                  </div>
                </div>
                <div class="customer-footer">
                  <span class="last-visit">Última compra: {{ customer.ultimaCompra ? formatDate(customer.ultimaCompra) : 'Sin compras' }}</span>
                  <div class="customer-actions">
                    <button class="icon-btn" title="Agregar puntos" (click)="addPoints(customer)">➕</button>
                    <button class="icon-btn" title="Canjear recompensa" (click)="redeemReward(customer)">🎁</button>
                    <button class="icon-btn" title="Ver historial" (click)="viewHistory(customer)">📜</button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Rewards Tab -->
      @if (activeTab === 'rewards') {
        <div class="rewards-section">
          <div class="rewards-header">
            <h2>Recompensas Disponibles</h2>
            <button class="add-reward-btn" (click)="showAddReward = true">
              ➕ Nueva Recompensa
            </button>
          </div>

          <div class="rewards-grid">
            @for (reward of rewards(); track reward.id) {
              <div class="reward-card" [class.inactive]="!reward.activo">
                <div class="reward-icon">
                  @switch (reward.tipo) {
                    @case ('descuento') { 💰 }
                    @case ('producto') { 🛍️ }
                    @case ('servicio') { ⭐ }
                  }
                </div>
                <div class="reward-content">
                  <h3>{{ reward.nombre }}</h3>
                  <p>{{ reward.descripcion }}</p>
                  <div class="reward-points">
                    <span class="points-badge">{{ reward.puntosRequeridos }} pts</span>
                    @if (reward.tipo === 'descuento') {
                      <span class="value-badge">{{ reward.valor }}% OFF</span>
                    }
                  </div>
                </div>
                <div class="reward-actions">
                  <button class="toggle-btn" (click)="toggleReward(reward)">
                    {{ reward.activo ? '✅' : '❌' }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- History Tab -->
      @if (activeTab === 'history') {
        <div class="history-section">
          <h2>Últimas Transacciones de Puntos</h2>
          <div class="history-list">
            @for (tx of recentTransactions(); track tx.id) {
              <div class="history-item" [class]="tx.tipo">
                <div class="tx-icon">
                  {{ tx.tipo === 'EARN' ? '➕' : '🎁' }}
                </div>
                <div class="tx-content">
                  <span class="tx-description">{{ tx.descripcion }}</span>
                  <span class="tx-date">{{ formatDate(tx.createdAt) }}</span>
                </div>
                <div class="tx-points" [class]="tx.tipo === 'EARN' ? 'ganados' : 'canjeados'">
                  {{ tx.tipo === 'EARN' ? '+' : '-' }}{{ tx.puntos }} pts
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Add Customer Modal -->
      @if (showAddCustomer) {
        <div class="modal-overlay" (click)="showAddCustomer = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>➕ Nuevo Cliente de Lealtad</h2>
            <form (ngSubmit)="saveCustomer()">
              <div class="form-group">
                <label>Nombre Completo</label>
                <input type="text" [(ngModel)]="newCustomer.nombre" name="nombre" required>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="newCustomer.email" name="email">
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" [(ngModel)]="newCustomer.telefono" name="telefono">
              </div>
              <div class="modal-actions">
                <button type="button" class="cancel-btn" (click)="showAddCustomer = false">Cancelar</button>
                <button type="submit" class="save-btn">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .loyalty-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: white;
      padding: 1.5rem;
    }

    /* Header */
    .loyalty-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-btn {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: white;
      font-size: 1.5rem;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateX(-2px);
    }

    .title-section h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.6);
      margin: 0.25rem 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
    }

    .action-btn.secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      padding: 1.5rem;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .gradient-purple { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); }
    .gradient-blue { background: linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%); }
    .gradient-green { background: linear-gradient(135deg, #10B981 0%, #34D399 100%); }
    .gradient-amber { background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }

    .stat-icon {
      font-size: 2.5rem;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
    }

    .stat-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    /* Tabs */
    .tabs-container {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.5rem;
      border-radius: 12px;
    }

    .tab-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
    }

    .tab-btn:hover:not(.active) {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    /* Search Bar */
    .search-bar {
      margin-bottom: 1.5rem;
    }

    .search-input {
      width: 100%;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: white;
      font-size: 1rem;
    }

    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    /* Customers Grid */
    .customers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .customer-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.2s;
    }

    .customer-card:hover {
      transform: translateY(-2px);
      border-color: rgba(99, 102, 241, 0.5);
    }

    .customer-card.nivel-platino {
      border-color: #F59E0B;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), transparent);
    }

    .customer-card.nivel-oro {
      border-color: #FBBF24;
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), transparent);
    }

    .customer-card.nivel-plata {
      border-color: #9CA3AF;
      background: linear-gradient(135deg, rgba(156, 163, 175, 0.1), transparent);
    }

    .customer-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .customer-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .customer-info h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    .nivel-badge {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .customer-stats {
      display: flex;
      gap: 2rem;
      padding: 0.75rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin: 0.75rem 0;
    }

    .customer-stats .stat {
      display: flex;
      flex-direction: column;
    }

    .customer-stats .label {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .customer-stats .value {
      font-size: 1.1rem;
      font-weight: 700;
    }

    .customer-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .last-visit {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .customer-actions {
      display: flex;
      gap: 0.5rem;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer;
      transition: all 0.2s;
    }

    .icon-btn:hover {
      background: rgba(99, 102, 241, 0.5);
      transform: scale(1.1);
    }

    /* Rewards Grid */
    .rewards-section h2,
    .history-section h2 {
      margin-bottom: 1.5rem;
    }

    .rewards-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .add-reward-btn {
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #10B981, #34D399);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .rewards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .reward-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .reward-card.inactive {
      opacity: 0.5;
    }

    .reward-icon {
      font-size: 2rem;
    }

    .reward-content h3 {
      margin: 0 0 0.5rem;
    }

    .reward-content p {
      margin: 0 0 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.875rem;
    }

    .reward-points {
      display: flex;
      gap: 0.5rem;
    }

    .points-badge {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .value-badge {
      background: linear-gradient(135deg, #10B981, #34D399);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .toggle-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
    }

    /* History List */
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .history-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }

    .tx-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .history-item.ganados .tx-icon {
      background: rgba(16, 185, 129, 0.2);
    }

    .history-item.canjeados .tx-icon {
      background: rgba(236, 72, 153, 0.2);
    }

    .tx-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .tx-description {
      font-weight: 500;
    }

    .tx-date {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .tx-points {
      font-weight: 700;
      font-size: 1.1rem;
    }

    .tx-points.ganados {
      color: #10B981;
    }

    .tx-points.canjeados {
      color: #EC4899;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 20px;
      padding: 2rem;
      width: 90%;
      max-width: 450px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .modal-content h2 {
      margin: 0 0 1.5rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
      color: white;
      font-size: 1rem;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .cancel-btn {
      flex: 1;
      padding: 0.75rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: transparent;
      color: white;
      cursor: pointer;
    }

    .save-btn {
      flex: 1;
      padding: 0.75rem;
      border-radius: 10px;
      border: none;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      font-weight: 600;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .loyalty-container {
        padding: 1rem;
        padding-bottom: 5rem; /* Space for bottom nav if present */
      }

      .loyalty-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .header-left {
        width: 100%;
      }

      .title-section h1 {
        font-size: 1.5rem;
      }

      .header-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      .action-btn {
        width: 100%;
        justify-content: center;
        padding: 0.75rem;
        font-size: 0.9rem;
      }

      .stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      .stat-card {
        padding: 1rem;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .stat-icon {
        font-size: 2rem;
      }

      .stat-value {
        font-size: 1.5rem;
      }

      .tabs-container {
        overflow-x: auto;
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
      }

      .tab-btn {
        padding: 0.6rem 1rem;
        font-size: 0.9rem;
        white-space: nowrap;
      }

      /* Customers Grid Mobile */
      .customers-grid {
        grid-template-columns: 1fr;
      }

      .customer-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .customer-actions {
        width: 100%;
        justify-content: space-between;
      }

      .icon-btn {
        padding: 0.5rem;
        width: 40px;
        height: 40px;
      }

      /* Rewards Grid Mobile */
      .rewards-grid {
        grid-template-columns: 1fr;
      }

      .reward-card {
        flex-direction: column;
        align-items: flex-start;
      }

      .reward-actions {
        width: 100%;
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .header-actions {
        grid-template-columns: 1fr;
      }

      .customer-stats {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem 0;
      }

      .modal-content {
        width: 95%;
        padding: 1.5rem;
      }
    }
  `]
})
export class LoyaltyComponent implements OnInit {
  private authService = inject(AuthService);
  private loyaltyService = inject(LoyaltyService);

  activeTab: 'customers' | 'rewards' | 'history' = 'customers';
  searchQuery = '';
  showAddCustomer = false;
  showAddReward = false;
  showSettings = false;
  loading = signal(false);
  selectedCustomerId: string | null = null;

  newCustomer = {
    nombre: '',
    email: '',
    telefono: ''
  };

  customers = signal<LoyaltyCustomer[]>([]);
  rewards = signal<Reward[]>([]);
  transactions = signal<LoyaltyTransaction[]>([]);
  stats = signal<{ totalCustomers: number; totalPointsInCirculation: number; activeRewards: number }>({
    totalCustomers: 0, totalPointsInCirculation: 0, activeRewards: 0
  });

  // Computed values
  totalCustomers = computed(() => this.stats().totalCustomers || this.customers().length);
  totalPuntosActivos = computed(() => this.stats().totalPointsInCirculation || this.customers().reduce((sum, c) => sum + c.puntosActuales, 0));
  rewardsCanjeados = computed(() => this.transactions().filter(t => t.tipo === 'REDEEM').length);
  clientesPlatino = computed(() => this.customers().filter(c => c.nivel === 'PLATINO').length);

  filteredCustomers = computed(() => {
    const query = this.searchQuery.toLowerCase();
    if (!query) return this.customers();
    return this.customers().filter(c =>
      c.nombre.toLowerCase().includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.telefono && c.telefono.includes(query))
    );
  });

  recentTransactions = computed(() => this.transactions().slice(0, 20));

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    // Load customers
    this.loyaltyService.getCustomers(0, 100).subscribe({
      next: (response: any) => {
        const list = response.content || response;
        this.customers.set(Array.isArray(list) ? list : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    // Load rewards
    this.loyaltyService.getRewards().subscribe({
      next: (data) => this.rewards.set(data),
      error: () => { }
    });
    // Load stats
    this.loyaltyService.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: () => { }
    });
  }

  getNivelIcon(nivel: string): string {
    switch (nivel?.toUpperCase()) {
      case 'PLATINO': return '💎';
      case 'ORO': return '🥇';
      case 'PLATA': return '🥈';
      default: return '🥉';
    }
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  addPoints(customer: LoyaltyCustomer) {
    const points = prompt('Ingrese los puntos a agregar:', '100');
    if (points) {
      const amount = parseInt(points);
      if (isNaN(amount) || amount <= 0) return;
      this.loyaltyService.addPoints(customer.id, { puntos: amount, descripcion: `Puntos manuales` }).subscribe({
        next: () => this.loadData(),
        error: (err) => alert('Error al agregar puntos: ' + (err.error?.message || err.message))
      });
    }
  }

  redeemReward(customer: LoyaltyCustomer) {
    const points = prompt(`Puntos a canjear para ${customer.nombre} (disponible: ${customer.puntosActuales}):`, '500');
    if (points) {
      const amount = parseInt(points);
      if (isNaN(amount) || amount <= 0) return;
      if (amount > customer.puntosActuales) {
        alert('Puntos insuficientes');
        return;
      }
      this.loyaltyService.redeemPoints(customer.id, { puntos: amount, descripcion: 'Canje en módulo de lealtad' }).subscribe({
        next: () => this.loadData(),
        error: (err) => alert('Error al canjear: ' + (err.error?.message || err.message || 'Puntos insuficientes'))
      });
    }
  }

  viewHistory(customer: LoyaltyCustomer) {
    this.selectedCustomerId = customer.id;
    this.activeTab = 'history';
    this.loyaltyService.getTransactions(customer.id).subscribe({
      next: (data) => this.transactions.set(data),
      error: () => this.transactions.set([])
    });
  }

  toggleReward(reward: Reward) {
    this.rewards.update(rewards =>
      rewards.map(r => r.id === reward.id ? { ...r, activo: !r.activo } : r)
    );
  }

  saveCustomer() {
    if (!this.newCustomer.nombre) return;
    this.loyaltyService.createCustomer(this.newCustomer).subscribe({
      next: (created) => {
        this.customers.update(c => [created, ...c]);
        this.showAddCustomer = false;
        this.newCustomer = { nombre: '', email: '', telefono: '' };
      },
      error: (err) => alert('Error al crear cliente: ' + (err.error?.message || err.message))
    });
  }
}
