import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

interface SaleRecord {
    id: string;
    numero: string;
    fecha: Date;
    total: number;
    items: number;
    medioPago: string;
    estado: 'COMPLETADA' | 'ANULADA';
}

interface DailyStats {
    fecha: string;
    ventas: number;
    transacciones: number;
    ticketPromedio: number;
}

@Component({
    selector: 'app-sales-report',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="reports-container">
      <header class="reports-header">
        <div class="header-left">
          <button class="btn-icon" routerLink="/dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-title">
            <h1>Reportes</h1>
            <span class="subtitle">Análisis de ventas</span>
          </div>
        </div>
        <div class="date-filter">
          <select [(ngModel)]="selectedPeriod" (change)="loadData()">
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
        </div>
      </header>

      <!-- Summary Cards -->
      <section class="summary-section">
        <div class="summary-card primary">
          <div class="summary-icon">💰</div>
          <div class="summary-content">
            <span class="summary-value">{{ formatPrice(totalVentas()) }}</span>
            <span class="summary-label">Ventas totales</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">🧾</div>
          <div class="summary-content">
            <span class="summary-value">{{ totalTransacciones() }}</span>
            <span class="summary-label">Transacciones</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">📊</div>
          <div class="summary-content">
            <span class="summary-value">{{ formatPrice(ticketPromedio()) }}</span>
            <span class="summary-label">Ticket promedio</span>
          </div>
        </div>
      </section>

      <!-- Top Products -->
      <section class="top-products-section">
        <h3 class="section-title">🏆 Productos más vendidos</h3>
        <div class="top-products">
          @for (product of topProducts(); track product.name; let i = $index) {
            <div class="top-product">
              <span class="rank">{{ i + 1 }}</span>
              <span class="product-name">{{ product.name }}</span>
              <span class="product-qty">{{ product.qty }} uds</span>
              <span class="product-revenue">{{ formatPrice(product.revenue) }}</span>
            </div>
          }
        </div>
      </section>

      <!-- Daily Chart -->
      <section class="chart-section">
        <h3 class="section-title">📈 Ventas por día</h3>
        <div class="chart-container">
          @for (day of dailyStats(); track day.fecha) {
            <div class="chart-bar-container">
              <div 
                class="chart-bar" 
                [style.height.%]="getBarHeight(day.ventas)">
              </div>
              <span class="chart-label">{{ formatDayLabel(day.fecha) }}</span>
            </div>
          }
        </div>
      </section>

      <!-- Recent Sales -->
      <section class="sales-section">
        <h3 class="section-title">🧾 Ventas recientes</h3>
        <div class="sales-list">
          @for (sale of recentSales(); track sale.id) {
            <div class="sale-card" [class.anulada]="sale.estado === 'ANULADA'">
              <div class="sale-info">
                <span class="sale-number">{{ sale.numero }}</span>
                <span class="sale-date">{{ formatDateTime(sale.fecha) }}</span>
              </div>
              <div class="sale-details">
                <span class="sale-items">{{ sale.items }} items</span>
                <span class="sale-payment">{{ sale.medioPago }}</span>
              </div>
              <div class="sale-total">
                {{ formatPrice(sale.total) }}
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
    styles: [`
    .reports-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding-bottom: 2rem;
    }

    .reports-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-left {
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
      
      svg { width: 20px; height: 20px; }
    }

    .header-title h1 { margin: 0; font-size: 1.5rem; }
    .header-title .subtitle { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }

    .date-filter select {
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: white;
      font-size: 0.9rem;
      
      option { background: #1e293b; }
    }

    .summary-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      padding: 1.5rem;
    }

    .summary-card {
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      
      &.primary {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
        border-color: rgba(99, 102, 241, 0.3);
      }
    }

    .summary-icon { font-size: 1.5rem; }
    .summary-value { 
      font-size: 1.35rem; 
      font-weight: 700; 
      color: #10B981; 
    }
    .summary-label { 
      font-size: 0.75rem; 
      color: rgba(255, 255, 255, 0.5); 
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
      margin: 0 0 1rem;
    }

    .top-products-section, .chart-section, .sales-section {
      padding: 0 1.5rem 1.5rem;
    }

    .top-products {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .top-product {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.875rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
    }

    .rank {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .product-name { flex: 1; font-weight: 500; }
    .product-qty { color: rgba(255, 255, 255, 0.5); font-size: 0.85rem; }
    .product-revenue { font-weight: 600; color: #10B981; }

    .chart-container {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      height: 150px;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
    }

    .chart-bar-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      height: 100%;
    }

    .chart-bar {
      width: 100%;
      background: linear-gradient(to top, #6366F1, #8B5CF6);
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: height 0.3s ease;
    }

    .chart-label {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .sales-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sale-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      
      &.anulada {
        opacity: 0.5;
        background: rgba(239, 68, 68, 0.1);
      }
    }

    .sale-info {
      flex: 1;
      
      .sale-number {
        display: block;
        font-weight: 500;
      }
      .sale-date {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .sale-details {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .sale-total {
      font-weight: 700;
      font-size: 1.1rem;
      color: #10B981;
    }
  `]
})
export class SalesReportComponent implements OnInit {
    private authService = inject(AuthService);

    selectedPeriod = 'today';

    totalVentas = signal(0);
    totalTransacciones = signal(0);
    ticketPromedio = signal(0);
    topProducts = signal<{ name: string; qty: number; revenue: number }[]>([]);
    dailyStats = signal<DailyStats[]>([]);
    recentSales = signal<SaleRecord[]>([]);

    maxDailySales = 0;

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        // Mock data for demo
        this.totalVentas.set(245800);
        this.totalTransacciones.set(47);
        this.ticketPromedio.set(5230);

        this.topProducts.set([
            { name: 'Pan Marraqueta', qty: 156, revenue: 23400 },
            { name: 'Café Americano', qty: 89, revenue: 133500 },
            { name: 'Torta Chocolate', qty: 12, revenue: 144000 },
            { name: 'Pan Hallulla', qty: 98, revenue: 12740 },
            { name: 'Kuchen Manzana', qty: 8, revenue: 68000 }
        ]);

        const stats = [
            { fecha: '2024-12-10', ventas: 45200, transacciones: 12, ticketPromedio: 3767 },
            { fecha: '2024-12-11', ventas: 52800, transacciones: 15, ticketPromedio: 3520 },
            { fecha: '2024-12-12', ventas: 38600, transacciones: 9, ticketPromedio: 4289 },
            { fecha: '2024-12-13', ventas: 61200, transacciones: 18, ticketPromedio: 3400 },
            { fecha: '2024-12-14', ventas: 48000, transacciones: 11, ticketPromedio: 4364 },
        ];
        this.dailyStats.set(stats);
        this.maxDailySales = Math.max(...stats.map(s => s.ventas));

        this.recentSales.set([
            { id: '1', numero: 'V-0047', fecha: new Date(), total: 8500, items: 3, medioPago: 'Efectivo', estado: 'COMPLETADA' },
            { id: '2', numero: 'V-0046', fecha: new Date(Date.now() - 3600000), total: 12800, items: 5, medioPago: 'Débito', estado: 'COMPLETADA' },
            { id: '3', numero: 'V-0045', fecha: new Date(Date.now() - 7200000), total: 4500, items: 2, medioPago: 'Crédito', estado: 'COMPLETADA' },
            { id: '4', numero: 'V-0044', fecha: new Date(Date.now() - 10800000), total: 15600, items: 4, medioPago: 'Efectivo', estado: 'ANULADA' },
        ]);
    }

    getBarHeight(ventas: number): number {
        return this.maxDailySales > 0 ? (ventas / this.maxDailySales) * 100 : 0;
    }

    formatPrice(amount: number): string {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDateTime(date: Date): string {
        return date.toLocaleString('es-CL', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDayLabel(fecha: string): string {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CL', { weekday: 'short' });
    }
}
