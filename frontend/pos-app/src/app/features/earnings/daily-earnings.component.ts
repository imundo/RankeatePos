import { Component, inject, signal, computed, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { SalesService, DailyStats } from '@core/services/sales.service';
import { SalesEventService } from '@core/services/sales-event.service';
import { IndustryMockDataService } from '@core/services/industry-mock.service';

interface DayData {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  totalSales: number;
  transactionCount: number;
  topProduct?: string;
}

interface DailySummary {
  date: string;
  totalVentas: number;
  totalTransacciones: number;
  ventasAprobadas: number;
  ventasRechazadas: number;
  productosMasVendidos: { nombre: string; cantidad: number; total: number }[];
  ventasPorHora: { hora: string; total: number }[];
  mediosPago: { tipo: string; icon: string; cantidad: number; total: number; porcentaje: number }[];
}

@Component({
  selector: 'app-daily-earnings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="earnings-container">
      <header class="earnings-header">
        <div class="header-left">
          <button class="btn-icon" routerLink="/dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="header-title">
            <h1>💰 Ganancias Diarias</h1>
            <span class="subtitle">Control de ventas y ganancias</span>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-mini">
            <span class="stat-value">{{ formatPrice(monthTotal()) }}</span>
            <span class="stat-label">Este mes</span>
          </div>
        </div>
      </header>

      <div class="earnings-content">
        <!-- Calendar Section -->
        <section class="calendar-section">
          <div class="calendar-header">
            <button class="btn-nav" (click)="prevMonth()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h2>{{ currentMonthName() }} {{ currentYear() }}</h2>
            <button class="btn-nav" (click)="nextMonth()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div class="calendar-grid">
            <div class="calendar-weekdays">
              @for (day of weekdays; track day) {
                <span>{{ day }}</span>
              }
            </div>
            
            <div class="calendar-days">
              @for (day of calendarDays(); track day.date.toISOString()) {
                <button 
                  class="calendar-day"
                  [class.other-month]="!day.isCurrentMonth"
                  [class.today]="day.isToday"
                  [class.selected]="day.isSelected"
                  [class.has-sales]="day.totalSales > 0"
                  (click)="selectDay(day)"
                >
                  <span class="day-number">{{ day.dayNumber }}</span>
                  @if (day.totalSales > 0 && day.isCurrentMonth) {
                    <span class="day-indicator"></span>
                    <span class="day-amount">{{ formatPriceShort(day.totalSales) }}</span>
                  }
                </button>
              }
            </div>
          </div>

          <!-- Month Summary -->
          <div class="month-summary">
            <div class="summary-card">
              <span class="summary-icon">📊</span>
              <div class="summary-info">
                <span class="summary-value">{{ monthTransactions() }}</span>
                <span class="summary-label">Transacciones</span>
              </div>
            </div>
            <div class="summary-card">
              <span class="summary-icon">✅</span>
              <div class="summary-info">
                <span class="summary-value">{{ monthApproved() }}</span>
                <span class="summary-label">Aprobadas</span>
              </div>
            </div>
            <div class="summary-card accent">
              <span class="summary-icon">💵</span>
              <div class="summary-info">
                <span class="summary-value">{{ formatPrice(monthTotal()) }}</span>
                <span class="summary-label">Total Mes</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Resizable Splitter -->
        <div 
          class="splitter"
          (mousedown)="startResize($event)"
          [class.dragging]="isDragging()"
        >
          <div class="splitter-line"></div>
        </div>

        <!-- Day Detail Section -->
        <section class="detail-section" [style.flex]="'1'">
          <div class="detail-header">
            <h3>
              📅 {{ selectedDateFormatted() }}
              @if (isSelectedToday()) {
                <span class="today-badge">Hoy</span>
              }
            </h3>
          </div>

          @if (selectedDaySummary()) {
            <div class="detail-content">
              <!-- Day Stats -->
              <div class="day-stats-grid">
                <div class="day-stat sales">
                  <div class="stat-icon">💰</div>
                  <div class="stat-details">
                    <span class="stat-amount">{{ formatPrice(selectedDaySummary()!.totalVentas) }}</span>
                    <span class="stat-label">Ventas del día</span>
                  </div>
                </div>
                <div class="day-stat transactions">
                  <div class="stat-icon">🧾</div>
                  <div class="stat-details">
                    <span class="stat-amount">{{ selectedDaySummary()!.totalTransacciones }}</span>
                    <span class="stat-label">Transacciones</span>
                  </div>
                </div>
                <div class="day-stat approved">
                  <div class="stat-icon">✅</div>
                  <div class="stat-details">
                    <span class="stat-amount">{{ selectedDaySummary()!.ventasAprobadas }}</span>
                    <span class="stat-label">Aprobadas</span>
                  </div>
                </div>
                <div class="day-stat rejected">
                  <div class="stat-icon">❌</div>
                  <div class="stat-details">
                    <span class="stat-amount">{{ selectedDaySummary()!.ventasRechazadas }}</span>
                    <span class="stat-label">Rechazadas</span>
                  </div>
                </div>
              </div>

              <!-- Top Products -->
              <div class="top-products-section">
                <h4>🏆 Productos Más Vendidos</h4>
                <div class="products-list">
                  @for (product of selectedDaySummary()!.productosMasVendidos; track product.nombre; let i = $index) {
                    <div class="product-row">
                      <span class="product-rank">{{ i + 1 }}</span>
                      <span class="product-name">{{ product.nombre }}</span>
                      <span class="product-qty">x{{ product.cantidad }}</span>
                      <span class="product-total">{{ formatPrice(product.total) }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Hours Chart -->
              <div class="hours-chart-section">
                <h4>📈 Ventas por Hora</h4>
                <div class="hours-chart">
                  @for (hour of selectedDaySummary()!.ventasPorHora; track hour.hora) {
                    <div class="hour-bar-container">
                      <div 
                        class="hour-bar" 
                        [style.height.%]="getBarHeight(hour.total)"
                        [class.highlight]="hour.total === getMaxHourSale()"
                      ></div>
                      <span class="hour-label">{{ hour.hora }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Payment Methods Section -->
              <div class="payment-methods-section">
                <h4>💳 Medios de Pago</h4>
                <div class="payment-methods-grid">
                  @for (pago of selectedDaySummary()!.mediosPago; track pago.tipo) {
                    <div class="payment-method-card">
                      <div class="pm-header">
                        <span class="pm-icon">{{ pago.icon }}</span>
                        <div class="pm-info">
                          <span class="pm-name">{{ pago.tipo }}</span>
                          <span class="pm-count">{{ pago.cantidad }} transacciones</span>
                        </div>
                        <span class="pm-percentage">{{ pago.porcentaje }}%</span>
                      </div>
                      <div class="pm-progress-bar">
                        <div class="pm-progress" [style.width.%]="pago.porcentaje"></div>
                      </div>
                      <span class="pm-total">{{ formatPrice(pago.total) }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          } @else {
            <div class="no-data">
              <span class="no-data-icon">📭</span>
              <p>Sin ventas registradas este día</p>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .earnings-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
    }

    .earnings-header {
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

    .header-stats {
      display: flex;
      gap: 1rem;
    }

    .stat-mini {
      text-align: right;
      
      .stat-value {
        display: block;
        font-size: 1.25rem;
        font-weight: 700;
        background: linear-gradient(135deg, #10B981, #34D399);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .stat-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
      }
    }

    .earnings-content {
      display: flex;
      gap: 0;
      padding: 1.5rem;
      min-height: calc(100vh - 120px);
      
      @media (max-width: 1024px) {
        flex-direction: column;
        gap: 1rem;
      }
      
      @media (max-width: 600px) {
        padding: 1rem;
      }
    }

    /* Resizable Splitter */
    .splitter {
      width: 12px;
      cursor: col-resize;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      flex-shrink: 0;
      
      &:hover, &.dragging {
        background: rgba(99, 102, 241, 0.1);
        
        .splitter-line {
          background: #6366F1;
        }
      }
      
      .splitter-line {
        width: 4px;
        height: 60px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        transition: all 0.2s;
      }
      
      @media (max-width: 1024px) {
        display: none;
      }
    }

    .calendar-section {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 1.5rem;
      
      @media (max-width: 600px) {
        padding: 1rem;
        border-radius: 16px;
      }
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      
      h2 {
        margin: 0;
        font-size: 1.25rem;
        text-transform: capitalize;
      }
    }

    .btn-nav {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      background: transparent;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      
      &:hover {
        background: rgba(99, 102, 241, 0.2);
        border-color: rgba(99, 102, 241, 0.5);
      }
      
      svg { width: 18px; height: 18px; }
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.25rem;
      margin-bottom: 0.5rem;
      
      span {
        text-align: center;
        font-size: 0.75rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        padding: 0.5rem 0;
      }
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.25rem;
    }

    .calendar-day {
      aspect-ratio: 1;
      border: none;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.02);
      color: white;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.2s;
      padding: 0.25rem;
      
      &:hover {
        background: rgba(99, 102, 241, 0.15);
      }
      
      &.other-month {
        opacity: 0.3;
      }
      
      &.today {
        border: 2px solid #6366F1;
        
        .day-number {
          color: #6366F1;
          font-weight: 700;
        }
      }
      
      &.selected {
        background: linear-gradient(135deg, #6366F1, #8B5CF6);
        
        .day-number { color: white; }
        .day-amount { color: rgba(255,255,255,0.9); }
      }
      
      &.has-sales:not(.selected) {
        background: rgba(16, 185, 129, 0.1);
      }
    }

    .day-number {
      font-size: 0.9rem;
      font-weight: 500;
    }

    .day-indicator {
      position: absolute;
      bottom: 4px;
      width: 6px;
      height: 6px;
      background: #10B981;
      border-radius: 50%;
    }

    .day-amount {
      font-size: 0.6rem;
      color: #10B981;
      margin-top: 2px;
    }

    .month-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 1.5rem;
      
      @media (max-width: 600px) {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      min-width: 0;
      overflow: hidden;
      
      &.accent {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
        border-color: rgba(16, 185, 129, 0.3);
      }
      
      @media (max-width: 600px) {
        padding: 0.875rem;
        gap: 0.5rem;
      }
    }

    .summary-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
      
      @media (max-width: 600px) {
        font-size: 1.25rem;
      }
    }

    .summary-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    .summary-value {
      font-size: 1rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      @media (max-width: 600px) {
        font-size: 0.9rem;
      }
    }

    .summary-label {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .detail-section {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 1.5rem;
      
      @media (max-width: 600px) {
        padding: 1rem;
        border-radius: 16px;
      }
    }

    .detail-header {
      margin-bottom: 1.5rem;
      
      h3 {
        margin: 0;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        
        @media (max-width: 600px) {
          font-size: 1.1rem;
          gap: 0.5rem;
        }
      }
    }

    .today-badge {
      padding: 0.25rem 0.75rem;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .day-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
      
      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .day-stat {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      
      &.sales { border-left: 4px solid #10B981; }
      &.transactions { border-left: 4px solid #6366F1; }
      &.approved { border-left: 4px solid #22C55E; }
      &.rejected { border-left: 4px solid #EF4444; }
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-amount {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .top-products-section, .hours-chart-section {
      margin-bottom: 1.5rem;
      
      h4 {
        margin: 0 0 1rem;
        font-size: 1rem;
        font-weight: 600;
      }
    }

    .products-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .product-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 10px;
    }

    .product-rank {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .product-name {
      flex: 1;
      font-weight: 500;
    }

    .product-qty {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
    }

    .product-total {
      font-weight: 600;
      color: #10B981;
    }

    .hours-chart {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      height: 150px;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
    }

    .hour-bar-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      height: 100%;
    }

    .hour-bar {
      width: 100%;
      max-width: 30px;
      background: linear-gradient(180deg, #6366F1, #8B5CF6);
      border-radius: 4px 4px 0 0;
      transition: all 0.3s;
      min-height: 4px;
      
      &.highlight {
        background: linear-gradient(180deg, #10B981, #059669);
      }
    }

    .hour-label {
      font-size: 0.65rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: rgba(255, 255, 255, 0.5);
      
      .no-data-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }
    }

    .payment-methods-section {
      margin-top: 1.5rem;
      
      h4 {
        margin: 0 0 1rem;
        font-size: 1rem;
        font-weight: 600;
      }
    }

    .payment-methods-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .payment-method-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1rem;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.06);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      }
    }

    .pm-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .pm-icon {
      font-size: 1.75rem;
    }

    .pm-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .pm-name {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .pm-count {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .pm-percentage {
      font-size: 1.25rem;
      font-weight: 700;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .pm-progress-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .pm-progress {
      height: 100%;
      background: linear-gradient(90deg, #6366F1, #8B5CF6, #EC4899);
      border-radius: 3px;
      transition: width 0.5s ease-out;
    }

    .pm-total {
      font-size: 1.1rem;
      font-weight: 700;
      color: #10B981;
    }
  `]
})
export class DailyEarningsComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private salesService = inject(SalesService);
  private salesEventService = inject(SalesEventService);
  private industryMockService = inject(IndustryMockDataService);

  private subscriptions: Subscription[] = [];

  currentDate = signal(new Date());
  selectedDate = signal(new Date());

  weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Resizable splitter properties
  isDragging = signal(false);
  leftPanelWidth = signal(400);

  // Mock sales data for demo
  private salesData = signal<Record<string, DailySummary>>({});

  // Splitter resize methods
  startResize(event: MouseEvent) {
    event.preventDefault();
    this.isDragging.set(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging()) return;

    const container = document.querySelector('.earnings-content') as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newWidth = event.clientX - containerRect.left - 24; // 24px for padding

    // Constrain width between 250px and 600px
    const constrainedWidth = Math.max(250, Math.min(600, newWidth));
    this.leftPanelWidth.set(constrainedWidth);

    // Update calendar-section width
    const calendarSection = document.querySelector('.calendar-section') as HTMLElement;
    if (calendarSection) {
      calendarSection.style.width = `${constrainedWidth}px`;
      calendarSection.style.flexShrink = '0';
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isDragging()) {
      this.isDragging.set(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  ngOnInit() {
    // Set initial width
    setTimeout(() => {
      const calendarSection = document.querySelector('.calendar-section') as HTMLElement;
      if (calendarSection) {
        calendarSection.style.width = `${this.leftPanelWidth()}px`;
        calendarSection.style.flexShrink = '0';
      }
    }, 0);

    this.loadSalesData();

    // Subscribe to real-time sales updates (same tab)
    this.subscriptions.push(
      this.salesEventService.salesUpdated$.subscribe(() => {
        // Reload data when a new sale is made
        this.loadSalesData();
      })
    );

    // Listen for cross-tab sync events
    window.addEventListener('storage', (event) => {
      if (event.key === 'pos_sale_completed' && event.newValue) {
        console.log('Daily Earnings: Sale detected from another tab, refreshing...');
        this.loadSalesData();
      }
    });

    // Auto-refresh every 20 seconds
    this.refreshInterval = setInterval(() => {
      this.loadSalesData();
    }, 20000);
  }

  private refreshInterval: any;

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadSalesData() {
    // Try to load real data from API
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth() + 1;

    this.salesService.getMonthlyStats(year, month).subscribe({
      next: (stats) => {
        const data: Record<string, DailySummary> = {};
        stats.forEach(stat => {
          data[stat.fecha] = {
            date: stat.fecha,
            totalVentas: stat.totalVentas || 0,
            totalTransacciones: stat.totalTransacciones || 0,
            ventasAprobadas: stat.ventasAprobadas || 0,
            ventasRechazadas: stat.ventasRechazadas || 0,
            productosMasVendidos: stat.topProductos?.map(p => ({
              nombre: p.nombre,
              cantidad: p.cantidad,
              total: p.total
            })) || [],
            ventasPorHora: stat.ventasPorHora?.map(h => ({
              hora: h.horaLabel || String(h.hora),
              total: h.total
            })) || [],
            mediosPago: (stat as any).mediosPago?.map((m: any) => ({
              tipo: m.tipo,
              icon: m.tipo === 'Efectivo' ? '💵' : m.tipo === 'Transferencia' ? '📱' : '💳',
              cantidad: m.cantidad,
              total: m.total,
              porcentaje: m.porcentaje
            })) || [
                { tipo: 'Efectivo', icon: '💵', cantidad: Math.floor((stat.totalTransacciones || 0) * 0.4), total: (stat.totalVentas || 0) * 0.35, porcentaje: 35 },
                { tipo: 'Tarjeta', icon: '💳', cantidad: Math.floor((stat.totalTransacciones || 0) * 0.5), total: (stat.totalVentas || 0) * 0.55, porcentaje: 55 },
                { tipo: 'Transferencia', icon: '📱', cantidad: Math.floor((stat.totalTransacciones || 0) * 0.1), total: (stat.totalVentas || 0) * 0.10, porcentaje: 10 },
              ]
          };
        });
        this.salesData.set(data);
      },
      error: () => {
        // Fallback to mock data for demo
        this.loadMockData();
      }
    });
  }

  loadMockData() {
    // Generate mock data for demo
    const today = new Date();
    const data: Record<string, DailySummary> = {};

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = this.formatDateKey(date);

      if (Math.random() > 0.3) {
        const totalTx = Math.floor(Math.random() * 25) + 5;
        const approved = Math.floor(totalTx * 0.9);

        data[key] = {
          date: key,
          totalVentas: Math.floor(Math.random() * 200000) + 50000,
          totalTransacciones: totalTx,
          ventasAprobadas: approved,
          ventasRechazadas: totalTx - approved,
          productosMasVendidos: this.industryMockService.getMockTopProducts().slice(0, 4).map(p => ({
            nombre: p.nombre,
            cantidad: Math.floor(Math.random() * 30) + 10,
            total: Math.floor(Math.random() * 20000) + 5000
          })),
          ventasPorHora: [
            { hora: '8', total: Math.floor(Math.random() * 20000) },
            { hora: '9', total: Math.floor(Math.random() * 35000) },
            { hora: '10', total: Math.floor(Math.random() * 40000) },
            { hora: '11', total: Math.floor(Math.random() * 30000) },
            { hora: '12', total: Math.floor(Math.random() * 50000) },
            { hora: '13', total: Math.floor(Math.random() * 45000) },
            { hora: '14', total: Math.floor(Math.random() * 25000) },
            { hora: '15', total: Math.floor(Math.random() * 20000) },
            { hora: '16', total: Math.floor(Math.random() * 30000) },
            { hora: '17', total: Math.floor(Math.random() * 35000) },
            { hora: '18', total: Math.floor(Math.random() * 40000) },
            { hora: '19', total: Math.floor(Math.random() * 25000) },
          ],
          mediosPago: [
            { tipo: 'Efectivo', icon: '💵', cantidad: Math.floor(totalTx * 0.35), total: Math.floor(Math.random() * 60000) + 20000, porcentaje: 35 },
            { tipo: 'Tarjeta Débito', icon: '💳', cantidad: Math.floor(totalTx * 0.40), total: Math.floor(Math.random() * 80000) + 30000, porcentaje: 40 },
            { tipo: 'Tarjeta Crédito', icon: '💳', cantidad: Math.floor(totalTx * 0.15), total: Math.floor(Math.random() * 40000) + 15000, porcentaje: 15 },
            { tipo: 'Transferencia', icon: '📱', cantidad: Math.floor(totalTx * 0.10), total: Math.floor(Math.random() * 20000) + 5000, porcentaje: 10 },
          ]
        };
      }
    }

    this.salesData.set(data);
  }

  currentMonthName = computed(() => {
    return this.currentDate().toLocaleDateString('es-CL', { month: 'long' });
  });

  currentYear = computed(() => this.currentDate().getFullYear());

  calendarDays = computed(() => {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();

    const days: DayData[] = [];
    const today = new Date();

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(this.createDayData(date, false));
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const isToday = this.isSameDay(date, today);
      const isSelected = this.isSameDay(date, this.selectedDate());
      const salesData = this.salesData()[this.formatDateKey(date)];

      days.push({
        date,
        dayNumber: i,
        isCurrentMonth: true,
        isToday,
        isSelected,
        totalSales: salesData?.totalVentas || 0,
        transactionCount: salesData?.totalTransacciones || 0,
        topProduct: salesData?.productosMasVendidos?.[0]?.nombre
      });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push(this.createDayData(date, false));
    }

    return days;
  });

  private createDayData(date: Date, isCurrentMonth: boolean): DayData {
    return {
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday: false,
      isSelected: false,
      totalSales: 0,
      transactionCount: 0
    };
  }

  monthTotal = computed(() => {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    let total = 0;

    Object.entries(this.salesData()).forEach(([key, data]) => {
      const [y, m] = key.split('-').map(Number);
      if (y === year && m - 1 === month) {
        total += data.totalVentas;
      }
    });

    return total;
  });

  monthTransactions = computed(() => {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    let total = 0;

    Object.entries(this.salesData()).forEach(([key, data]) => {
      const [y, m] = key.split('-').map(Number);
      if (y === year && m - 1 === month) {
        total += data.totalTransacciones;
      }
    });

    return total;
  });

  monthApproved = computed(() => {
    const year = this.currentDate().getFullYear();
    const month = this.currentDate().getMonth();
    let total = 0;

    Object.entries(this.salesData()).forEach(([key, data]) => {
      const [y, m] = key.split('-').map(Number);
      if (y === year && m - 1 === month) {
        total += data.ventasAprobadas;
      }
    });

    return total;
  });

  selectedDaySummary = computed(() => {
    const key = this.formatDateKey(this.selectedDate());
    return this.salesData()[key] || null;
  });

  selectedDateFormatted = computed(() => {
    return this.selectedDate().toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  });

  isSelectedToday = computed(() => this.isSameDay(this.selectedDate(), new Date()));

  prevMonth() {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth() {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  selectDay(day: DayData) {
    this.selectedDate.set(day.date);
  }

  getBarHeight(value: number): number {
    const max = this.getMaxHourSale();
    return max > 0 ? (value / max) * 100 : 0;
  }

  getMaxHourSale(): number {
    const summary = this.selectedDaySummary();
    if (!summary) return 0;
    return Math.max(...summary.ventasPorHora.map(h => h.total));
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatPriceShort(amount: number): string {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${Math.floor(amount / 1000)}k`;
    return amount.toString();
  }

  private formatDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }
}
