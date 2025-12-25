import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

interface Subscription {
    id: string;
    customerId: string;
    customerName: string;
    plan: SubscriptionPlan;
    estado: 'activa' | 'pausada' | 'cancelada';
    fechaInicio: string;
    proximaEntrega: string;
    frecuencia: 'diaria' | 'semanal' | 'quincenal' | 'mensual';
    productos: SubscriptionItem[];
    totalMensual: number;
    metodoPago: string;
}

interface SubscriptionPlan {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    frecuencia: string;
    beneficios: string[];
    popular?: boolean;
}

interface SubscriptionItem {
    productoId: string;
    nombre: string;
    cantidad: number;
    precio: number;
}

@Component({
    selector: 'app-subscriptions',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="subscriptions-container">
      <!-- Header -->
      <header class="subs-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-btn">←</a>
          <div class="title-section">
            <h1>🔄 Suscripciones</h1>
            <p class="subtitle">Gestiona pedidos recurrentes y entregas programadas</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn primary" (click)="showNewSubscription = true">
            ➕ Nueva Suscripción
          </button>
        </div>
      </header>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card gradient-purple">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <span class="stat-value">{{ subscriptionsActivas() }}</span>
            <span class="stat-label">Suscripciones Activas</span>
          </div>
        </div>
        <div class="stat-card gradient-green">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <span class="stat-value">{{ formatPrice(ingresoMensual()) }}</span>
            <span class="stat-label">Ingreso Mensual Recurrente</span>
          </div>
        </div>
        <div class="stat-card gradient-blue">
          <div class="stat-icon">🚚</div>
          <div class="stat-content">
            <span class="stat-value">{{ entregasHoy() }}</span>
            <span class="stat-label">Entregas Hoy</span>
          </div>
        </div>
        <div class="stat-card gradient-amber">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <span class="stat-value">{{ retentionRate() }}%</span>
            <span class="stat-label">Tasa de Retención</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active]="activeTab === 'active'" (click)="activeTab = 'active'">
          ✅ Activas ({{ subscriptionsActivas() }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'plans'" (click)="activeTab = 'plans'">
          📋 Planes
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'deliveries'" (click)="activeTab = 'deliveries'">
          🚚 Entregas del Día
        </button>
      </div>

      <!-- Active Subscriptions -->
      @if (activeTab === 'active') {
        <div class="subscriptions-list">
          @for (sub of subscriptions(); track sub.id) {
            <div class="subscription-card" [class]="'estado-' + sub.estado">
              <div class="sub-header">
                <div class="customer-info">
                  <div class="customer-avatar">{{ sub.customerName.charAt(0) }}</div>
                  <div>
                    <h3>{{ sub.customerName }}</h3>
                    <span class="plan-name">{{ sub.plan.nombre }}</span>
                  </div>
                </div>
                <div class="sub-status">
                  <span class="status-badge" [class]="sub.estado">
                    {{ getStatusLabel(sub.estado) }}
                  </span>
                </div>
              </div>

              <div class="sub-details">
                <div class="detail">
                  <span class="label">Frecuencia</span>
                  <span class="value">{{ getFrecuenciaLabel(sub.frecuencia) }}</span>
                </div>
                <div class="detail">
                  <span class="label">Próxima Entrega</span>
                  <span class="value highlight">{{ formatDate(sub.proximaEntrega) }}</span>
                </div>
                <div class="detail">
                  <span class="label">Productos</span>
                  <span class="value">{{ sub.productos.length }} items</span>
                </div>
                <div class="detail">
                  <span class="label">Total</span>
                  <span class="value price">{{ formatPrice(sub.totalMensual) }}/mes</span>
                </div>
              </div>

              <div class="sub-products">
                @for (item of sub.productos; track item.productoId) {
                  <span class="product-tag">{{ item.cantidad }}x {{ item.nombre }}</span>
                }
              </div>

              <div class="sub-actions">
                @if (sub.estado === 'activa') {
                  <button class="action-btn-sm pause" (click)="pauseSubscription(sub)">⏸️ Pausar</button>
                }
                @if (sub.estado === 'pausada') {
                  <button class="action-btn-sm resume" (click)="resumeSubscription(sub)">▶️ Reanudar</button>
                }
                <button class="action-btn-sm edit" (click)="editSubscription(sub)">✏️ Editar</button>
                <button class="action-btn-sm cancel" (click)="cancelSubscription(sub)">❌ Cancelar</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Plans -->
      @if (activeTab === 'plans') {
        <div class="plans-grid">
          @for (plan of plans(); track plan.id) {
            <div class="plan-card" [class.popular]="plan.popular">
              @if (plan.popular) {
                <div class="popular-badge">⭐ Más Popular</div>
              }
              <h3>{{ plan.nombre }}</h3>
              <p class="plan-description">{{ plan.descripcion }}</p>
              <div class="plan-price">
                <span class="price">{{ formatPrice(plan.precio) }}</span>
                <span class="frecuencia">/{{ plan.frecuencia }}</span>
              </div>
              <ul class="benefits-list">
                @for (benefit of plan.beneficios; track benefit) {
                  <li>✅ {{ benefit }}</li>
                }
              </ul>
              <button class="select-plan-btn" (click)="selectPlan(plan)">
                Seleccionar Plan
              </button>
            </div>
          }
        </div>
      }

      <!-- Today's Deliveries -->
      @if (activeTab === 'deliveries') {
        <div class="deliveries-section">
          <div class="deliveries-header">
            <h2>🚚 Entregas Programadas - {{ formatDate(today) }}</h2>
            <button class="print-btn">🖨️ Imprimir Ruta</button>
          </div>

          <div class="deliveries-list">
            @for (delivery of todayDeliveries(); track delivery.id) {
              <div class="delivery-card" [class.completed]="delivery.entregado">
                <div class="delivery-time">
                  {{ delivery.horaEstimada }}
                </div>
                <div class="delivery-info">
                  <h4>{{ delivery.customerName }}</h4>
                  <p class="address">📍 {{ delivery.direccion }}</p>
                  <div class="delivery-items">
                    @for (item of delivery.productos; track item.nombre) {
                      <span class="item-tag">{{ item.cantidad }}x {{ item.nombre }}</span>
                    }
                  </div>
                </div>
                <div class="delivery-total">
                  {{ formatPrice(delivery.total) }}
                </div>
                <div class="delivery-actions">
                  @if (!delivery.entregado) {
                    <button class="deliver-btn" (click)="markDelivered(delivery)">
                      ✅ Entregar
                    </button>
                  } @else {
                    <span class="delivered-badge">✅ Entregado</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .subscriptions-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: white;
      padding: 1.5rem;
    }

    .subs-header {
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
    }

    .title-section h1 { font-size: 1.75rem; margin: 0; }
    .subtitle { color: rgba(255, 255, 255, 0.6); margin: 0.25rem 0 0; }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
    }

    /* Stats */
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

    .gradient-purple { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
    .gradient-green { background: linear-gradient(135deg, #10B981, #34D399); }
    .gradient-blue { background: linear-gradient(135deg, #3B82F6, #0EA5E9); }
    .gradient-amber { background: linear-gradient(135deg, #F59E0B, #FBBF24); }

    .stat-icon { font-size: 2.5rem; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.75rem; font-weight: 800; }
    .stat-label { font-size: 0.875rem; opacity: 0.9; }

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
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
    }

    /* Subscriptions List */
    .subscriptions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .subscription-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .subscription-card.estado-activa {
      border-left: 4px solid #10B981;
    }

    .subscription-card.estado-pausada {
      border-left: 4px solid #F59E0B;
      opacity: 0.8;
    }

    .sub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .customer-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .customer-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
    }

    .customer-info h3 { margin: 0; }
    .plan-name { color: rgba(255, 255, 255, 0.6); font-size: 0.875rem; }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge.activa { background: rgba(16, 185, 129, 0.2); color: #10B981; }
    .status-badge.pausada { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
    .status-badge.cancelada { background: rgba(239, 68, 68, 0.2); color: #EF4444; }

    .sub-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      padding: 1rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .detail { display: flex; flex-direction: column; }
    .detail .label { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); }
    .detail .value { font-weight: 600; }
    .detail .value.highlight { color: #10B981; }
    .detail .value.price { color: #8B5CF6; }

    .sub-products {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .product-tag {
      background: rgba(99, 102, 241, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
    }

    .sub-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .action-btn-sm {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .action-btn-sm.pause { color: #F59E0B; }
    .action-btn-sm.resume { color: #10B981; }
    .action-btn-sm.cancel { color: #EF4444; }

    /* Plans Grid */
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .plan-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
      text-align: center;
    }

    .plan-card.popular {
      border-color: #8B5CF6;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
    }

    .popular-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      padding: 0.25rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .plan-card h3 { font-size: 1.5rem; margin: 0 0 0.5rem; }
    .plan-description { color: rgba(255, 255, 255, 0.6); margin-bottom: 1.5rem; }

    .plan-price {
      margin-bottom: 1.5rem;
    }

    .plan-price .price {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #6366F1, #EC4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .plan-price .frecuencia {
      color: rgba(255, 255, 255, 0.5);
    }

    .benefits-list {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem;
      text-align: left;
    }

    .benefits-list li {
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .select-plan-btn {
      width: 100%;
      padding: 1rem;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      font-weight: 600;
      cursor: pointer;
    }

    /* Deliveries */
    .deliveries-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .print-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: transparent;
      color: white;
      cursor: pointer;
    }

    .deliveries-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .delivery-card {
      display: grid;
      grid-template-columns: 80px 1fr auto auto;
      gap: 1.5rem;
      align-items: center;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .delivery-card.completed {
      opacity: 0.6;
      border-color: #10B981;
    }

    .delivery-time {
      font-size: 1.25rem;
      font-weight: 700;
      color: #6366F1;
    }

    .delivery-info h4 { margin: 0 0 0.25rem; }
    .address { margin: 0; color: rgba(255, 255, 255, 0.6); font-size: 0.875rem; }

    .delivery-items {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }

    .item-tag {
      background: rgba(99, 102, 241, 0.2);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .delivery-total {
      font-size: 1.25rem;
      font-weight: 700;
      color: #10B981;
    }

    .deliver-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      border: none;
      background: linear-gradient(135deg, #10B981, #34D399);
      color: white;
      font-weight: 600;
      cursor: pointer;
    }

    .delivered-badge {
      color: #10B981;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .delivery-card {
        grid-template-columns: 1fr;
        text-align: center;
      }
    }
  `]
})
export class SubscriptionsComponent implements OnInit {
    private authService = inject(AuthService);

    activeTab: 'active' | 'plans' | 'deliveries' = 'active';
    showNewSubscription = false;
    today = new Date().toISOString();

    // Demo plans
    plans = signal<SubscriptionPlan[]>([
        {
            id: '1',
            nombre: 'Pan Diario',
            descripcion: 'Pan fresco todos los días en tu puerta',
            precio: 45000,
            frecuencia: 'mes',
            beneficios: ['1 kg de pan diario', 'Entrega a domicilio', '10% descuento en pastelería', 'Cambio de variedad gratis'],
            popular: true
        },
        {
            id: '2',
            nombre: 'Desayuno Familiar',
            descripcion: 'Kit de desayuno semanal para 4 personas',
            precio: 35000,
            frecuencia: 'mes',
            beneficios: ['Pan variado (2kg/semana)', '6 croissants', '1 torta mensual', 'Café molido 250g']
        },
        {
            id: '3',
            nombre: 'Cafetería Premium',
            descripcion: 'Para los amantes del café',
            precio: 55000,
            frecuencia: 'mes',
            beneficios: ['Café especial 500g/semana', '12 croissants', 'Acceso a variedades exclusivas', '20% en cafetería']
        }
    ]);

    // Demo subscriptions
    subscriptions = signal<Subscription[]>([
        {
            id: '1',
            customerId: '1',
            customerName: 'María González',
            plan: this.plans()[0],
            estado: 'activa',
            fechaInicio: '2024-10-15',
            proximaEntrega: '2024-12-26',
            frecuencia: 'diaria',
            productos: [
                { productoId: '1', nombre: 'Marraqueta', cantidad: 1, precio: 2000 },
                { productoId: '2', nombre: 'Hallulla', cantidad: 0.5, precio: 1000 }
            ],
            totalMensual: 45000,
            metodoPago: 'Débito automático'
        },
        {
            id: '2',
            customerId: '2',
            customerName: 'Juan Pérez',
            plan: this.plans()[1],
            estado: 'activa',
            fechaInicio: '2024-11-01',
            proximaEntrega: '2024-12-28',
            frecuencia: 'semanal',
            productos: [
                { productoId: '1', nombre: 'Pan Surtido', cantidad: 2, precio: 4000 },
                { productoId: '3', nombre: 'Croissants', cantidad: 6, precio: 9000 }
            ],
            totalMensual: 35000,
            metodoPago: 'Tarjeta crédito'
        },
        {
            id: '3',
            customerId: '3',
            customerName: 'Ana Martínez',
            plan: this.plans()[0],
            estado: 'pausada',
            fechaInicio: '2024-09-20',
            proximaEntrega: '2025-01-10',
            frecuencia: 'diaria',
            productos: [
                { productoId: '1', nombre: 'Marraqueta', cantidad: 0.5, precio: 1000 }
            ],
            totalMensual: 30000,
            metodoPago: 'Transferencia'
        }
    ]);

    // Today's deliveries
    todayDeliveries = signal([
        {
            id: '1',
            subscriptionId: '1',
            customerName: 'María González',
            direccion: 'Av. Providencia 1234, Depto 501',
            horaEstimada: '08:00',
            productos: [{ nombre: 'Marraqueta', cantidad: 1 }, { nombre: 'Hallulla', cantidad: 0.5 }],
            total: 3000,
            entregado: true
        },
        {
            id: '2',
            subscriptionId: '4',
            customerName: 'Roberto Silva',
            direccion: 'Los Leones 567, Casa 12',
            horaEstimada: '08:30',
            productos: [{ nombre: 'Pan Integral', cantidad: 1 }],
            total: 2500,
            entregado: true
        },
        {
            id: '3',
            subscriptionId: '5',
            customerName: 'Patricia Díaz',
            direccion: 'Av. Apoquindo 4500, Of. 302',
            horaEstimada: '09:00',
            productos: [{ nombre: 'Croissants', cantidad: 6 }, { nombre: 'Café Molido', cantidad: 1 }],
            total: 15000,
            entregado: false
        },
        {
            id: '4',
            subscriptionId: '6',
            customerName: 'Carlos López',
            direccion: 'Vitacura 3200',
            horaEstimada: '10:00',
            productos: [{ nombre: 'Marraqueta', cantidad: 1.5 }],
            total: 3000,
            entregado: false
        }
    ]);

    // Computed
    subscriptionsActivas = computed(() => this.subscriptions().filter(s => s.estado === 'activa').length);
    ingresoMensual = computed(() => this.subscriptions().filter(s => s.estado === 'activa').reduce((sum, s) => sum + s.totalMensual, 0));
    entregasHoy = computed(() => this.todayDeliveries().length);
    retentionRate = signal(94);

    ngOnInit() { }

    formatPrice(amount: number): string {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('es-CL', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    }

    getStatusLabel(estado: string): string {
        switch (estado) {
            case 'activa': return '✅ Activa';
            case 'pausada': return '⏸️ Pausada';
            case 'cancelada': return '❌ Cancelada';
            default: return estado;
        }
    }

    getFrecuenciaLabel(freq: string): string {
        switch (freq) {
            case 'diaria': return 'Diaria';
            case 'semanal': return 'Semanal';
            case 'quincenal': return 'Quincenal';
            case 'mensual': return 'Mensual';
            default: return freq;
        }
    }

    pauseSubscription(sub: Subscription) {
        this.subscriptions.update(subs =>
            subs.map(s => s.id === sub.id ? { ...s, estado: 'pausada' as const } : s)
        );
    }

    resumeSubscription(sub: Subscription) {
        this.subscriptions.update(subs =>
            subs.map(s => s.id === sub.id ? { ...s, estado: 'activa' as const } : s)
        );
    }

    cancelSubscription(sub: Subscription) {
        if (confirm('¿Estás seguro de cancelar esta suscripción?')) {
            this.subscriptions.update(subs =>
                subs.map(s => s.id === sub.id ? { ...s, estado: 'cancelada' as const } : s)
            );
        }
    }

    editSubscription(sub: Subscription) {
        alert('Editar suscripción: ' + sub.customerName);
    }

    selectPlan(plan: SubscriptionPlan) {
        alert('Plan seleccionado: ' + plan.nombre);
    }

    markDelivered(delivery: any) {
        this.todayDeliveries.update(dels =>
            dels.map(d => d.id === delivery.id ? { ...d, entregado: true } : d)
        );
    }
}
