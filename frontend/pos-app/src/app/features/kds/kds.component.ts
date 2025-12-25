import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

interface KitchenOrder {
    id: string;
    numero: string;
    tipo: 'local' | 'delivery' | 'pickup';
    mesa?: string;
    items: KitchenItem[];
    estado: 'pendiente' | 'preparando' | 'listo' | 'entregado';
    prioridad: 'normal' | 'alta' | 'urgente';
    tiempoIngreso: Date;
    tiempoEstimado: number; // minutes
    notas?: string;
    cliente?: string;
}

interface KitchenItem {
    id: string;
    nombre: string;
    cantidad: number;
    modificadores?: string[];
    estado: 'pendiente' | 'preparando' | 'listo';
}

@Component({
    selector: 'app-kds',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="kds-container" [class.fullscreen]="isFullscreen()">
      <!-- Header -->
      <header class="kds-header">
        <div class="header-left">
          @if (!isFullscreen()) {
            <a routerLink="/dashboard" class="back-btn">←</a>
          }
          <div class="title-section">
            <h1>🍳 Cocina - KDS</h1>
            <span class="time">{{ currentTime() }}</span>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat pending">
            <span class="count">{{ pendingCount() }}</span>
            <span class="label">Pendientes</span>
          </div>
          <div class="stat preparing">
            <span class="count">{{ preparingCount() }}</span>
            <span class="label">En Preparación</span>
          </div>
          <div class="stat ready">
            <span class="count">{{ readyCount() }}</span>
            <span class="label">Listos</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn" (click)="toggleFullscreen()">
            {{ isFullscreen() ? '🔲' : '⛶' }} {{ isFullscreen() ? 'Salir' : 'Pantalla Completa' }}
          </button>
          <button class="action-btn sound" [class.muted]="soundMuted()" (click)="toggleSound()">
            {{ soundMuted() ? '🔇' : '🔔' }}
          </button>
        </div>
      </header>

      <!-- Orders Grid -->
      <div class="orders-grid">
        @for (order of orders(); track order.id) {
          <div class="order-card" 
               [class]="'estado-' + order.estado + ' prioridad-' + order.prioridad"
               [class.urgent-pulse]="order.prioridad === 'urgente'">
            
            <!-- Order Header -->
            <div class="order-header">
              <div class="order-number">
                <span class="numero">{{ order.numero }}</span>
                <span class="tipo-badge" [class]="order.tipo">
                  {{ getTipoIcon(order.tipo) }} {{ getTipoLabel(order.tipo) }}
                </span>
              </div>
              <div class="order-timer" [class.warning]="getElapsedMinutes(order) > order.tiempoEstimado">
                ⏱️ {{ getElapsedMinutes(order) }} min
              </div>
            </div>

            @if (order.mesa) {
              <div class="order-mesa">📍 Mesa {{ order.mesa }}</div>
            }
            @if (order.cliente) {
              <div class="order-cliente">👤 {{ order.cliente }}</div>
            }

            <!-- Items List -->
            <div class="order-items">
              @for (item of order.items; track item.id) {
                <div class="item" [class]="'item-' + item.estado" (click)="toggleItemStatus(order, item)">
                  <div class="item-qty">{{ item.cantidad }}x</div>
                  <div class="item-info">
                    <span class="item-name">{{ item.nombre }}</span>
                    @if (item.modificadores?.length) {
                      <div class="item-mods">
                        @for (mod of item.modificadores; track mod) {
                          <span class="mod">+ {{ mod }}</span>
                        }
                      </div>
                    }
                  </div>
                  <div class="item-status">
                    @switch (item.estado) {
                      @case ('pendiente') { ⬜ }
                      @case ('preparando') { 🔄 }
                      @case ('listo') { ✅ }
                    }
                  </div>
                </div>
              }
            </div>

            @if (order.notas) {
              <div class="order-notes">
                📝 {{ order.notas }}
              </div>
            }

            <!-- Order Actions -->
            <div class="order-actions">
              @switch (order.estado) {
                @case ('pendiente') {
                  <button class="action-btn start" (click)="startOrder(order)">
                    ▶️ Iniciar Preparación
                  </button>
                }
                @case ('preparando') {
                  <button class="action-btn complete" (click)="completeOrder(order)">
                    ✅ Marcar Listo
                  </button>
                }
                @case ('listo') {
                  <button class="action-btn deliver" (click)="deliverOrder(order)">
                    🚀 Entregar
                  </button>
                }
              }
              <button class="action-btn bump" (click)="bumpOrder(order)" title="Mover al final">
                ⏭️
              </button>
            </div>
          </div>
        }

        @if (orders().length === 0) {
          <div class="empty-state">
            <span class="emoji">🎉</span>
            <h2>¡Todo listo!</h2>
            <p>No hay pedidos pendientes en este momento</p>
          </div>
        }
      </div>

      <!-- Audio for notifications -->
      <audio #orderAlert src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1..." preload="auto"></audio>
    </div>
  `,
    styles: [`
    .kds-container {
      min-height: 100vh;
      background: #0a0a0f;
      color: white;
      padding: 1rem;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .kds-container.fullscreen {
      position: fixed;
      inset: 0;
      z-index: 9999;
      padding: 1rem;
    }

    /* Header */
    .kds-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: white;
      font-size: 1.25rem;
    }

    .title-section {
      display: flex;
      flex-direction: column;
    }

    .title-section h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .time {
      font-size: 2rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      color: #10B981;
    }

    .header-stats {
      display: flex;
      gap: 1.5rem;
    }

    .header-stats .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 1rem;
      border-radius: 10px;
    }

    .stat.pending { background: rgba(245, 158, 11, 0.2); }
    .stat.preparing { background: rgba(59, 130, 246, 0.2); }
    .stat.ready { background: rgba(16, 185, 129, 0.2); }

    .stat .count {
      font-size: 1.75rem;
      font-weight: 800;
    }

    .stat .label {
      font-size: 0.75rem;
      opacity: 0.7;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .action-btn.sound.muted {
      opacity: 0.5;
    }

    /* Orders Grid */
    .orders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
      align-items: start;
    }

    .order-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .order-card.estado-pendiente {
      border-color: #F59E0B;
    }

    .order-card.estado-preparando {
      border-color: #3B82F6;
      background: rgba(59, 130, 246, 0.05);
    }

    .order-card.estado-listo {
      border-color: #10B981;
      background: rgba(16, 185, 129, 0.05);
    }

    .order-card.prioridad-alta {
      border-width: 3px;
    }

    .order-card.prioridad-urgente {
      border-width: 4px;
      border-color: #EF4444;
    }

    .order-card.urgent-pulse {
      animation: urgentPulse 1s ease-in-out infinite;
    }

    @keyframes urgentPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    }

    /* Order Header */
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
    }

    .order-number {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .numero {
      font-size: 1.5rem;
      font-weight: 800;
    }

    .tipo-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .tipo-badge.local { background: rgba(99, 102, 241, 0.3); }
    .tipo-badge.delivery { background: rgba(16, 185, 129, 0.3); }
    .tipo-badge.pickup { background: rgba(245, 158, 11, 0.3); }

    .order-timer {
      font-size: 1.1rem;
      font-weight: 600;
      color: #10B981;
    }

    .order-timer.warning {
      color: #EF4444;
      animation: timerPulse 1s ease-in-out infinite;
    }

    @keyframes timerPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .order-mesa, .order-cliente {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
    }

    /* Items */
    .order-items {
      padding: 0.5rem;
    }

    .item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.03);
      margin-bottom: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .item:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .item.item-listo {
      opacity: 0.5;
      text-decoration: line-through;
    }

    .item.item-preparando {
      background: rgba(59, 130, 246, 0.1);
      border-left: 3px solid #3B82F6;
    }

    .item-qty {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .item-info {
      flex: 1;
    }

    .item-name {
      font-weight: 600;
      font-size: 1rem;
    }

    .item-mods {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.25rem;
    }

    .mod {
      font-size: 0.75rem;
      color: #F59E0B;
    }

    .item-status {
      font-size: 1.25rem;
    }

    /* Notes */
    .order-notes {
      padding: 0.75rem 1rem;
      margin: 0.5rem;
      background: rgba(245, 158, 11, 0.1);
      border-radius: 8px;
      font-size: 0.875rem;
      border-left: 3px solid #F59E0B;
    }

    /* Actions */
    .order-actions {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .order-actions .action-btn {
      flex: 1;
      padding: 1rem;
      font-weight: 600;
    }

    .action-btn.start {
      background: linear-gradient(135deg, #F59E0B, #D97706);
    }

    .action-btn.complete {
      background: linear-gradient(135deg, #10B981, #059669);
    }

    .action-btn.deliver {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
    }

    .action-btn.bump {
      flex: 0;
      width: 50px;
      background: rgba(255, 255, 255, 0.1);
    }

    /* Empty State */
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-state .emoji {
      font-size: 5rem;
    }

    .empty-state h2 {
      margin: 1rem 0 0.5rem;
      font-size: 2rem;
    }

    .empty-state p {
      color: rgba(255, 255, 255, 0.5);
    }

    @media (max-width: 768px) {
      .orders-grid {
        grid-template-columns: 1fr;
      }

      .kds-header {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class KdsComponent implements OnInit {
    private authService = inject(AuthService);

    isFullscreen = signal(false);
    soundMuted = signal(false);
    currentTime = signal(this.formatTime(new Date()));

    // Demo orders
    orders = signal<KitchenOrder[]>([
        {
            id: '1',
            numero: '#0028',
            tipo: 'local',
            mesa: '5',
            estado: 'preparando',
            prioridad: 'normal',
            tiempoIngreso: new Date(Date.now() - 8 * 60000),
            tiempoEstimado: 15,
            items: [
                { id: '1', nombre: 'Café con Leche', cantidad: 2, estado: 'listo' },
                { id: '2', nombre: 'Tostada Francés', cantidad: 2, modificadores: ['Sin mantequilla'], estado: 'preparando' },
                { id: '3', nombre: 'Jugo Natural', cantidad: 1, modificadores: ['Naranja'], estado: 'pendiente' }
            ]
        },
        {
            id: '2',
            numero: '#0029',
            tipo: 'delivery',
            cliente: 'Juan Pérez',
            estado: 'pendiente',
            prioridad: 'alta',
            tiempoIngreso: new Date(Date.now() - 3 * 60000),
            tiempoEstimado: 20,
            notas: 'Sin cebolla en las empanadas',
            items: [
                { id: '4', nombre: 'Empanada Pino', cantidad: 6, estado: 'pendiente' },
                { id: '5', nombre: 'Empanada Queso', cantidad: 4, estado: 'pendiente' },
                { id: '6', nombre: 'Bebida 2L', cantidad: 1, estado: 'pendiente' }
            ]
        },
        {
            id: '3',
            numero: '#0030',
            tipo: 'pickup',
            cliente: 'María González',
            estado: 'listo',
            prioridad: 'normal',
            tiempoIngreso: new Date(Date.now() - 12 * 60000),
            tiempoEstimado: 10,
            items: [
                { id: '7', nombre: 'Torta Chocolate', cantidad: 1, estado: 'listo' },
                { id: '8', nombre: 'Croissants', cantidad: 6, estado: 'listo' }
            ]
        },
        {
            id: '4',
            numero: '#0031',
            tipo: 'local',
            mesa: '12',
            estado: 'pendiente',
            prioridad: 'urgente',
            tiempoIngreso: new Date(Date.now() - 1 * 60000),
            tiempoEstimado: 8,
            notas: '¡CLIENTE VIP - PRIORIDAD!',
            items: [
                { id: '9', nombre: 'Café Espresso', cantidad: 2, estado: 'pendiente' },
                { id: '10', nombre: 'Pan con Palta', cantidad: 2, modificadores: ['Extra palta', 'Huevo pochado'], estado: 'pendiente' }
            ]
        }
    ]);

    // Computed stats
    pendingCount = computed(() => this.orders().filter(o => o.estado === 'pendiente').length);
    preparingCount = computed(() => this.orders().filter(o => o.estado === 'preparando').length);
    readyCount = computed(() => this.orders().filter(o => o.estado === 'listo').length);

    ngOnInit() {
        // Update time every second
        setInterval(() => {
            this.currentTime.set(this.formatTime(new Date()));
        }, 1000);
    }

    formatTime(date: Date): string {
        return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    getElapsedMinutes(order: KitchenOrder): number {
        return Math.floor((Date.now() - order.tiempoIngreso.getTime()) / 60000);
    }

    getTipoIcon(tipo: string): string {
        switch (tipo) {
            case 'local': return '🪑';
            case 'delivery': return '🛵';
            case 'pickup': return '🏃';
            default: return '📦';
        }
    }

    getTipoLabel(tipo: string): string {
        switch (tipo) {
            case 'local': return 'Local';
            case 'delivery': return 'Delivery';
            case 'pickup': return 'Para Llevar';
            default: return tipo;
        }
    }

    toggleFullscreen() {
        this.isFullscreen.update(v => !v);
        if (this.isFullscreen()) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    }

    toggleSound() {
        this.soundMuted.update(v => !v);
    }

    toggleItemStatus(order: KitchenOrder, item: KitchenItem) {
        const nextStatus: Record<string, 'pendiente' | 'preparando' | 'listo'> = {
            'pendiente': 'preparando',
            'preparando': 'listo',
            'listo': 'pendiente'
        };

        this.orders.update(orders =>
            orders.map(o => o.id === order.id ? {
                ...o,
                items: o.items.map(i => i.id === item.id ? { ...i, estado: nextStatus[i.estado] } : i)
            } : o)
        );
    }

    startOrder(order: KitchenOrder) {
        this.orders.update(orders =>
            orders.map(o => o.id === order.id ? { ...o, estado: 'preparando' as const } : o)
        );
    }

    completeOrder(order: KitchenOrder) {
        this.orders.update(orders =>
            orders.map(o => o.id === order.id ? {
                ...o,
                estado: 'listo' as const,
                items: o.items.map(i => ({ ...i, estado: 'listo' as const }))
            } : o)
        );
    }

    deliverOrder(order: KitchenOrder) {
        this.orders.update(orders => orders.filter(o => o.id !== order.id));
    }

    bumpOrder(order: KitchenOrder) {
        this.orders.update(orders => {
            const filtered = orders.filter(o => o.id !== order.id);
            return [...filtered, order];
        });
    }
}
