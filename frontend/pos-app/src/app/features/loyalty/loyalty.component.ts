import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

interface LoyaltyCustomer {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    puntos: number;
    nivel: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
    totalCompras: number;
    ultimaVisita: string;
    fechaRegistro: string;
}

interface Reward {
    id: string;
    nombre: string;
    descripcion: string;
    puntosRequeridos: number;
    tipo: 'descuento' | 'producto' | 'servicio';
    valor: number;
    activo: boolean;
    imagen?: string;
}

interface PointsTransaction {
    id: string;
    customerId: string;
    tipo: 'ganados' | 'canjeados';
    puntos: number;
    descripcion: string;
    fecha: string;
}

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
                    <span class="value">{{ customer.puntos | number }}</span>
                  </div>
                  <div class="stat">
                    <span class="label">Total Compras</span>
                    <span class="value">{{ formatPrice(customer.totalCompras) }}</span>
                  </div>
                </div>
                <div class="customer-footer">
                  <span class="last-visit">Última visita: {{ formatDate(customer.ultimaVisita) }}</span>
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
                  {{ tx.tipo === 'ganados' ? '➕' : '🎁' }}
                </div>
                <div class="tx-content">
                  <span class="tx-description">{{ tx.descripcion }}</span>
                  <span class="tx-date">{{ formatDate(tx.fecha) }}</span>
                </div>
                <div class="tx-points" [class]="tx.tipo">
                  {{ tx.tipo === 'ganados' ? '+' : '-' }}{{ tx.puntos }} pts
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
      .loyalty-header {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: stretch;
      }

      .action-btn {
        flex: 1;
      }

      .tabs-container {
        overflow-x: auto;
      }
    }
  `]
})
export class LoyaltyComponent implements OnInit {
    private authService = inject(AuthService);

    activeTab: 'customers' | 'rewards' | 'history' = 'customers';
    searchQuery = '';
    showAddCustomer = false;
    showAddReward = false;
    showSettings = false;

    newCustomer = {
        nombre: '',
        email: '',
        telefono: ''
    };

    // Demo customers
    customers = signal<LoyaltyCustomer[]>([
        { id: '1', nombre: 'María González', email: 'maria@email.com', telefono: '+56912345678', puntos: 2450, nivel: 'Oro', totalCompras: 485000, ultimaVisita: '2024-12-24', fechaRegistro: '2024-01-15' },
        { id: '2', nombre: 'Juan Pérez', email: 'juan@email.com', telefono: '+56987654321', puntos: 5200, nivel: 'Platino', totalCompras: 1250000, ultimaVisita: '2024-12-25', fechaRegistro: '2023-06-20' },
        { id: '3', nombre: 'Ana Martínez', email: 'ana@email.com', telefono: '+56911223344', puntos: 890, nivel: 'Plata', totalCompras: 156000, ultimaVisita: '2024-12-20', fechaRegistro: '2024-08-10' },
        { id: '4', nombre: 'Carlos López', email: 'carlos@email.com', telefono: '+56955667788', puntos: 350, nivel: 'Bronce', totalCompras: 45000, ultimaVisita: '2024-12-15', fechaRegistro: '2024-11-01' },
        { id: '5', nombre: 'Patricia Díaz', email: 'patricia@email.com', telefono: '+56944556677', puntos: 1850, nivel: 'Oro', totalCompras: 380000, ultimaVisita: '2024-12-23', fechaRegistro: '2024-03-05' },
        { id: '6', nombre: 'Roberto Silva', email: 'roberto@email.com', telefono: '+56933445566', puntos: 3100, nivel: 'Platino', totalCompras: 890000, ultimaVisita: '2024-12-25', fechaRegistro: '2023-09-15' },
    ]);

    // Demo rewards
    rewards = signal<Reward[]>([
        { id: '1', nombre: 'Café Gratis', descripcion: 'Un café espresso o americano gratis', puntosRequeridos: 500, tipo: 'producto', valor: 1500, activo: true },
        { id: '2', nombre: '10% Descuento', descripcion: 'Descuento en tu próxima compra', puntosRequeridos: 1000, tipo: 'descuento', valor: 10, activo: true },
        { id: '3', nombre: 'Torta de Regalo', descripcion: 'Una porción de torta a elección', puntosRequeridos: 1500, tipo: 'producto', valor: 4500, activo: true },
        { id: '4', nombre: '20% Descuento', descripcion: 'Descuento especial para clientes fieles', puntosRequeridos: 3000, tipo: 'descuento', valor: 20, activo: true },
        { id: '5', nombre: 'Desayuno Premium', descripcion: 'Desayuno completo para 2 personas', puntosRequeridos: 5000, tipo: 'servicio', valor: 25000, activo: true },
        { id: '6', nombre: '50% Aniversario', descripcion: 'Descuento especial de cumpleaños', puntosRequeridos: 0, tipo: 'descuento', valor: 50, activo: false },
    ]);

    // Demo transactions
    transactions = signal<PointsTransaction[]>([
        { id: '1', customerId: '1', tipo: 'ganados', puntos: 450, descripcion: 'Compra #0015 - María González', fecha: '2024-12-25T10:30:00' },
        { id: '2', customerId: '2', tipo: 'canjeados', puntos: 1000, descripcion: 'Canje: 10% Descuento - Juan Pérez', fecha: '2024-12-25T09:15:00' },
        { id: '3', customerId: '6', tipo: 'ganados', puntos: 890, descripcion: 'Compra #0014 - Roberto Silva', fecha: '2024-12-24T18:45:00' },
        { id: '4', customerId: '5', tipo: 'ganados', puntos: 320, descripcion: 'Compra #0013 - Patricia Díaz', fecha: '2024-12-24T16:20:00' },
        { id: '5', customerId: '1', tipo: 'canjeados', puntos: 500, descripcion: 'Canje: Café Gratis - María González', fecha: '2024-12-24T11:00:00' },
        { id: '6', customerId: '3', tipo: 'ganados', puntos: 180, descripcion: 'Compra #0012 - Ana Martínez', fecha: '2024-12-23T14:30:00' },
    ]);

    // Computed values
    totalCustomers = computed(() => this.customers().length);
    totalPuntosActivos = computed(() => this.customers().reduce((sum, c) => sum + c.puntos, 0));
    rewardsCanjeados = computed(() => this.transactions().filter(t => t.tipo === 'canjeados').length);
    clientesPlatino = computed(() => this.customers().filter(c => c.nivel === 'Platino').length);

    filteredCustomers = computed(() => {
        const query = this.searchQuery.toLowerCase();
        if (!query) return this.customers();
        return this.customers().filter(c =>
            c.nombre.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            c.telefono.includes(query)
        );
    });

    recentTransactions = computed(() => this.transactions().slice(0, 10));

    ngOnInit() {
        // Load data
    }

    getNivelIcon(nivel: string): string {
        switch (nivel) {
            case 'Platino': return '💎';
            case 'Oro': return '🥇';
            case 'Plata': return '🥈';
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
            this.customers.update(customers =>
                customers.map(c => c.id === customer.id ? { ...c, puntos: c.puntos + amount } : c)
            );
            this.transactions.update(txs => [{
                id: crypto.randomUUID(),
                customerId: customer.id,
                tipo: 'ganados',
                puntos: amount,
                descripcion: `Puntos manuales - ${customer.nombre}`,
                fecha: new Date().toISOString()
            }, ...txs]);
        }
    }

    redeemReward(customer: LoyaltyCustomer) {
        alert(`Selecciona una recompensa para ${customer.nombre}`);
    }

    viewHistory(customer: LoyaltyCustomer) {
        this.activeTab = 'history';
    }

    toggleReward(reward: Reward) {
        this.rewards.update(rewards =>
            rewards.map(r => r.id === reward.id ? { ...r, activo: !r.activo } : r)
        );
    }

    saveCustomer() {
        if (!this.newCustomer.nombre) return;

        const customer: LoyaltyCustomer = {
            id: crypto.randomUUID(),
            ...this.newCustomer,
            puntos: 0,
            nivel: 'Bronce',
            totalCompras: 0,
            ultimaVisita: new Date().toISOString().split('T')[0],
            fechaRegistro: new Date().toISOString().split('T')[0]
        };

        this.customers.update(c => [customer, ...c]);
        this.showAddCustomer = false;
        this.newCustomer = { nombre: '', email: '', telefono: '' };
    }
}
