import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ReservationsService } from '@core/services/reservations.service';

// Multi-industry service types
interface ServiceType {
  id: string;
  codigo: string;
  nombre: string;
  icono: string;
  duracionDefault: number;
  color: string;
  industria: 'restaurante' | 'salon' | 'clinica' | 'oficina' | 'general';
}

// Customer for database modal
interface Customer {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  tier: 'vip' | 'gold' | 'silver' | 'bronze' | 'nuevo';
  visitas: number;
  gastoTotal: number;
  ultimaVisita?: string;
  notas?: string;
}

interface Reservation {
  id: string;
  cliente: string;
  clienteId?: string;
  telefono: string;
  email?: string;
  fecha: string;
  hora: string;
  duracion: number;
  personas: number;
  tipoServicio?: string;
  recurso?: string; // mesa, silla, puesto, etc.
  estado: 'confirmada' | 'pendiente' | 'cancelada' | 'completada' | 'no_show';
  notas?: string;
  precioEstimado?: number;
  createdAt: Date;
}

interface Resource {
  id: string;
  numero: string;
  nombre?: string;
  capacidad: number;
  tipo: string; // mesa, silla, puesto, consultorio
  ubicacion: string;
  estado: 'disponible' | 'ocupada' | 'reservada' | 'mantenimiento';
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  reservations: Reservation[];
}


@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reservations-container">
      <!-- Premium Header -->
      <header class="res-header premium-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-btn">←</a>
          <div class="title-section">
            <h1>📅 Reservas y Citas</h1>
            <p class="subtitle">Gestión inteligente de reservas adaptable a tu negocio</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn customers-btn" (click)="showCustomerModal.set(true)">
            <span class="btn-icon">👥</span>
            <span>Clientes</span>
            <span class="customer-badge">{{ customers().length }}</span>
          </button>
          <button class="action-btn primary" (click)="openNewReservation()">
            ➕ Nueva {{ selectedServiceType()?.nombre || 'Reserva' }}
          </button>
        </div>
      </header>

      <!-- Service Type Selector -->
      <section class="service-type-section">
        <div class="service-type-header">
          <span class="section-label">🏪 Tipo de Servicio</span>
          <span class="service-hint">Adapta las reservas a tu rubro</span>
        </div>
        <div class="service-type-grid">
          @for (svc of serviceTypes; track svc.id) {
            <button 
              class="service-type-card" 
              [class.active]="selectedServiceTypeId() === svc.id"
              [style.--svc-color]="svc.color"
              (click)="selectServiceType(svc)"
            >
              <span class="svc-icon">{{ svc.icono }}</span>
              <span class="svc-name">{{ svc.nombre }}</span>
              <span class="svc-industry">{{ svc.industria }}</span>
            </button>
          }
        </div>
      </section>

      <!-- Stats with Revenue -->
      <div class="stats-grid">
        <div class="stat-card gradient-purple">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <span class="stat-value">{{ todayReservations() }}</span>
            <span class="stat-label">Hoy</span>
          </div>
        </div>
        <div class="stat-card gradient-green">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <span class="stat-value">{{ confirmedCount() }}</span>
            <span class="stat-label">Confirmadas</span>
          </div>
        </div>
        <div class="stat-card gradient-amber">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <span class="stat-value">{{ pendingCount() }}</span>
            <span class="stat-label">Pendientes</span>
          </div>
        </div>
        <div class="stat-card gradient-blue">
          <div class="stat-icon">{{ getResourceIcon() }}</div>
          <div class="stat-content">
            <span class="stat-value">{{ availableResourcesCount() }}/{{ resources().length }}</span>
            <span class="stat-label">{{ getResourceLabel() }} Libres</span>
          </div>
        </div>
        <div class="stat-card gradient-emerald">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <span class="stat-value">{{ formatRevenue(estimatedRevenue()) }}</span>
            <span class="stat-label">Ingresos Est. Hoy</span>
          </div>
        </div>
      </div>

      <!-- Main Content: Calendar + Day Detail -->
      <div class="main-content">
        <!-- Calendar Section -->
        <section class="calendar-section">
          <div class="calendar-header">
            <button class="cal-nav-btn" (click)="prevMonth()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h2 class="cal-month-title">{{ currentMonthName() }}</h2>
            <button class="cal-nav-btn" (click)="nextMonth()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <button class="today-btn" (click)="goToToday()">Hoy</button>
          </div>

          <div class="calendar-grid">
            <!-- Weekday headers -->
            <div class="weekday-header">Dom</div>
            <div class="weekday-header">Lun</div>
            <div class="weekday-header">Mar</div>
            <div class="weekday-header">Mié</div>
            <div class="weekday-header">Jue</div>
            <div class="weekday-header">Vie</div>
            <div class="weekday-header">Sáb</div>

            <!-- Calendar days -->
            @for (day of calendarDays(); track day.date.getTime()) {
              <div 
                class="calendar-day" 
                [class.other-month]="!day.isCurrentMonth"
                [class.today]="day.isToday"
                [class.selected]="day.isSelected"
                [class.has-reservations]="day.reservations.length > 0"
                (click)="selectDate(day.date)"
              >
                <span class="day-number">{{ day.day }}</span>
                @if (day.reservations.length > 0) {
                  <div class="day-dots">
                    @for (res of day.reservations.slice(0, 3); track res.id) {
                      <span class="dot" [class]="res.estado"></span>
                    }
                    @if (day.reservations.length > 3) {
                      <span class="dot-more">+{{ day.reservations.length - 3 }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Legend -->
          <div class="calendar-legend">
            <div class="legend-item"><span class="dot confirmada"></span> Confirmada</div>
            <div class="legend-item"><span class="dot pendiente"></span> Pendiente</div>
            <div class="legend-item"><span class="dot completada"></span> Completada</div>
            <div class="legend-item"><span class="dot cancelada"></span> Cancelada</div>
          </div>
        </section>

        <!-- Day Detail Section -->
        <section class="day-detail-section">
          <div class="day-detail-header">
            <h3>{{ formatSelectedDate() }}</h3>
            <span class="res-count">{{ selectedDayReservations().length }} reservas</span>
          </div>

          <!-- Time slots visualization -->
          <div class="time-grid">
            @for (slot of timeSlots; track slot) {
              <div class="time-row" 
                   [class.has-reservation]="getReservationsForTime(slot).length > 0"
                   (click)="openNewReservationAtTime(slot)">
                <span class="time-label">{{ slot }}</span>
                <div class="time-content">
                  @for (res of getReservationsForTime(slot); track res.id) {
                    <div class="mini-res-card" [class]="res.estado" (click)="viewReservation(res); $event.stopPropagation()">
                      <div class="mini-res-info">
                        <span class="mini-res-name">{{ res.cliente }}</span>
                        <span class="mini-res-details">👥 {{ res.personas }} @if(res.recurso) { · {{ getResourceLabel() }} {{ res.recurso }} }</span>
                      </div>
                      <div class="mini-res-actions">
                        @if (res.estado === 'pendiente') {
                          <button class="mini-btn confirm" (click)="confirmReservation(res); $event.stopPropagation()" title="Confirmar">✓</button>
                        }
                        @if (res.estado === 'confirmada') {
                          <button class="mini-btn complete" (click)="completeReservation(res); $event.stopPropagation()" title="Completar">🏁</button>
                        }
                        <button class="mini-btn edit" (click)="editReservation(res); $event.stopPropagation()" title="Editar">✏️</button>
                      </div>
                    </div>
                  }
                  @if (getReservationsForTime(slot).length === 0) {
                    <div class="empty-slot">+ Agregar reserva</div>
                  }
                </div>
              </div>
            }
          </div>
        </section>
      </div>

      <!-- Tables Quick View -->
      <section class="tables-quick-section">
        <div class="section-header">
          <h3>🪑 Estado de Mesas</h3>
          <span class="quick-stats">{{ availableTablesCount() }} disponibles</span>
        </div>
        <div class="tables-quick-grid">
          @for (table of tables(); track table.id) {
            <div class="table-quick-card" [class]="table.estado" (click)="toggleResourceStatus(table)">
              <span class="table-num">{{ table.numero }}</span>
              <span class="table-cap">{{ table.capacidad }}p</span>
            </div>
          }
        </div>
      </section>

      <!-- New/Edit Reservation Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingReservation() ? '✏️ Editar Reserva' : '📅 Nueva Reserva' }}</h2>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>
            <form (ngSubmit)="saveReservation()" class="modal-form">
              <div class="form-section">
                <h4>👤 Datos del Cliente</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" [(ngModel)]="formData.cliente" name="cliente" placeholder="Nombre completo" required>
                  </div>
                  <div class="form-group">
                    <label>Teléfono *</label>
                    <input type="tel" [(ngModel)]="formData.telefono" name="telefono" placeholder="+56 9 1234 5678" required>
                  </div>
                </div>
                <div class="form-group">
                  <label>Email (opcional)</label>
                  <input type="email" [(ngModel)]="formData.email" name="email" placeholder="cliente@email.com">
                </div>
              </div>

              <div class="form-section">
                <h4>📅 Fecha y Hora</h4>
                <div class="form-row">
                  <div class="form-group">
                    <label>Fecha *</label>
                    <input type="date" [(ngModel)]="formData.fecha" name="fecha" required>
                  </div>
                  <div class="form-group">
                    <label>Hora *</label>
                    <select [(ngModel)]="formData.hora" name="hora" required>
                      @for (slot of timeSlots; track slot) {
                        <option [value]="slot">{{ slot }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Duración</label>
                    <select [(ngModel)]="formData.duracion" name="duracion">
                      <option [value]="60">1 hora</option>
                      <option [value]="90">1.5 horas</option>
                      <option [value]="120">2 horas</option>
                      <option [value]="180">3 horas</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Personas *</label>
                    <div class="people-selector">
                      @for (n of [1,2,3,4,5,6,7,8,10,12]; track n) {
                        <button type="button" class="people-btn" [class.active]="formData.personas === n" (click)="formData.personas = n">
                          {{ n }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h4>{{ getResourceIcon() }} {{ getResourceLabel() }}</h4>
                <div class="tables-selector">
                  <button type="button" class="table-option" [class.active]="!formData.recurso" (click)="formData.recurso = ''">
                    <span class="table-opt-icon">🎲</span>
                    <span>Auto-asignar</span>
                  </button>
                  @for (table of availableTables(); track table.id) {
                    <button type="button" class="table-option" [class.active]="formData.recurso === table.numero" (click)="formData.recurso = table.numero">
                      <span class="table-opt-num">{{ table.numero }}</span>
                      <span class="table-opt-cap">{{ table.capacidad }}p · {{ getLocationEmoji(table.ubicacion) }}</span>
                    </button>
                  }
                </div>
              </div>

              <div class="form-section">
                <h4>📝 Notas</h4>
                <textarea [(ngModel)]="formData.notas" name="notas" rows="3" placeholder="Cumpleaños, alergias, preferencias especiales..."></textarea>
              </div>

              <div class="modal-footer">
                @if (editingReservation()) {
                  <button type="button" class="btn-danger" (click)="deleteReservation()">🗑️ Eliminar</button>
                }
                <div class="footer-right">
                  <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
                  <button type="submit" class="btn-primary">
                    {{ editingReservation() ? 'Guardar Cambios' : 'Crear Reserva' }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- View Reservation Modal -->
      @if (viewingReservation()) {
        <div class="modal-overlay" (click)="viewingReservation.set(null)">
          <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
            <div class="view-res-header" [class]="viewingReservation()!.estado">
              <span class="view-res-status">{{ getStatusIcon(viewingReservation()!.estado) }} {{ getStatusLabel(viewingReservation()!.estado) }}</span>
              <button class="modal-close" (click)="viewingReservation.set(null)">✕</button>
            </div>
            <div class="view-res-body">
              <h2>{{ viewingReservation()!.cliente }}</h2>
              <div class="view-res-info-grid">
                <div class="info-item">
                  <span class="info-icon">📅</span>
                  <span>{{ formatDate(viewingReservation()!.fecha) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">🕐</span>
                  <span>{{ viewingReservation()!.hora }}</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">👥</span>
                  <span>{{ viewingReservation()!.personas }} personas</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">📞</span>
                  <span>{{ viewingReservation()!.telefono }}</span>
                </div>
                @if (viewingReservation()!.recurso) {
                  <div class="info-item">
                    <span class="info-icon">{{ getResourceIcon() }}</span>
                    <span>{{ getResourceLabel() }} {{ viewingReservation()!.recurso }}</span>
                  </div>
                }
              </div>
              @if (viewingReservation()!.notas) {
                <div class="view-res-notes">
                  <strong>📝 Notas:</strong>
                  <p>{{ viewingReservation()!.notas }}</p>
                </div>
              }
            </div>
            <div class="view-res-actions">
              @if (viewingReservation()!.estado === 'pendiente') {
                <button class="action-btn success" (click)="confirmReservation(viewingReservation()!); viewingReservation.set(null)">
                  ✅ Confirmar
                </button>
              }
              @if (viewingReservation()!.estado === 'confirmada') {
                <button class="action-btn success" (click)="completeReservation(viewingReservation()!); viewingReservation.set(null)">
                  🏁 Completar
                </button>
              }
              <button class="action-btn secondary" (click)="editReservation(viewingReservation()!); viewingReservation.set(null)">
                ✏️ Editar
              </button>
              @if (viewingReservation()!.estado !== 'cancelada' && viewingReservation()!.estado !== 'completada') {
                <button class="action-btn danger" (click)="cancelReservation(viewingReservation()!); viewingReservation.set(null)">
                  ❌ Cancelar
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Customer Database Modal -->
      @if (showCustomerModal()) {
        <div class="modal-overlay" (click)="showCustomerModal.set(false)">
          <div class="modal-content customer-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>👥 Base de Clientes</h2>
              <button class="modal-close" (click)="showCustomerModal.set(false)">✕</button>
            </div>
            
            <div class="customer-search-section">
              <input 
                type="text" 
                class="customer-search-input"
                placeholder="🔍 Buscar por nombre o teléfono..."
                [ngModel]="customerSearchQuery()"
                (ngModelChange)="customerSearchQuery.set($event)"
              >
              <div class="customer-filters">
                <button 
                  class="filter-btn" 
                  [class.active]="customerFilter() === 'todos'"
                  (click)="customerFilter.set('todos')"
                >Todos</button>
                <button 
                  class="filter-btn" 
                  [class.active]="customerFilter() === 'vip'"
                  (click)="customerFilter.set('vip')"
                >⭐ VIP</button>
                <button 
                  class="filter-btn" 
                  [class.active]="customerFilter() === 'frecuentes'"
                  (click)="customerFilter.set('frecuentes')"
                >♦ Frecuentes</button>
              </div>
            </div>

            <div class="customer-list">
              @for (customer of filteredCustomers(); track customer.id) {
                <div class="customer-card" (click)="selectCustomer(customer)">
                  <div class="customer-avatar">{{ customer.nombre.charAt(0) }}</div>
                  <div class="customer-info">
                    <div class="customer-name-row">
                      <span class="customer-name">{{ customer.nombre }}</span>
                      <span class="customer-tier" [class]="customer.tier">
                        {{ getTierIcon(customer.tier) }} {{ getTierLabel(customer.tier) }}
                      </span>
                    </div>
                    <div class="customer-details">
                      <span>📞 {{ customer.telefono }}</span>
                      @if (customer.email) {
                        <span>📧 {{ customer.email }}</span>
                      }
                    </div>
                    <div class="customer-stats">
                      <span>📅 {{ customer.visitas }} visitas</span>
                      <span>💰 {{ formatRevenue(customer.gastoTotal) }} gastado</span>
                    </div>
                  </div>
                  <button class="select-customer-btn">Seleccionar</button>
                </div>
              } @empty {
                <div class="no-customers">
                  <p>No se encontraron clientes</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reservations-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: white;
      padding: 1.5rem;
    }

    /* Header */
    .res-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left { display: flex; align-items: center; gap: 1rem; }

    .back-btn {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none; color: white; font-size: 1.25rem;
      transition: all 0.2s;
    }
    .back-btn:hover { background: rgba(255, 255, 255, 0.15); }

    .title-section h1 { margin: 0; font-size: 1.5rem; }
    .subtitle { color: rgba(255, 255, 255, 0.6); margin: 0.25rem 0 0; font-size: 0.875rem; }

    .action-btn {
      padding: 0.75rem 1.5rem; border-radius: 12px;
      border: none; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn.primary { 
      background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; 
    }
    .action-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); }
    .action-btn.success { background: linear-gradient(135deg, #10B981, #34D399); color: white; }
    .action-btn.secondary { background: rgba(255,255,255,0.1); color: white; }
    .action-btn.danger { background: rgba(239, 68, 68, 0.2); color: #f87171; }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 500px) { .stats-grid { grid-template-columns: 1fr; } }

    .stat-card {
      padding: 1.25rem; border-radius: 16px;
      display: flex; align-items: center; gap: 1rem;
    }

    .gradient-purple { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
    .gradient-green { background: linear-gradient(135deg, #10B981, #34D399); }
    .gradient-amber { background: linear-gradient(135deg, #F59E0B, #FBBF24); }
    .gradient-blue { background: linear-gradient(135deg, #3B82F6, #60A5FA); }
    .gradient-emerald { background: linear-gradient(135deg, #059669, #10B981); }

    .stat-icon { font-size: 2rem; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 800; }
    .stat-label { font-size: 0.8rem; opacity: 0.9; }

    /* Premium Header enhancements */
    .premium-header {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05));
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1rem 1.5rem;
    }

    .customers-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(236, 72, 153, 0.15);
      border: 1px solid rgba(236, 72, 153, 0.3);
      color: #F9A8D4;
    }
    .customers-btn:hover {
      background: rgba(236, 72, 153, 0.25);
      transform: translateY(-2px);
    }
    .btn-icon { font-size: 1.1rem; }
    .customer-badge {
      background: #EC4899;
      color: white;
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
    }

    /* Service Type Selector */
    .service-type-section {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1rem 1.5rem;
      margin-bottom: 1.5rem;
    }

    .service-type-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .section-label { font-weight: 600; font-size: 0.95rem; }
    .service-hint { font-size: 0.75rem; color: rgba(255,255,255,0.5); }

    .service-type-grid {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .service-type-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      border: 2px solid transparent;
      background: rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: all 0.25s ease;
      min-width: 90px;
    }
    .service-type-card:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }
    .service-type-card.active {
      border-color: var(--svc-color, #6366F1);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.1));
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2);
    }

    .svc-icon { font-size: 1.5rem; }
    .svc-name { font-weight: 600; font-size: 0.85rem; }
    .svc-industry { 
      font-size: 0.65rem; 
      color: rgba(255,255,255,0.4); 
      text-transform: capitalize;
    }

    /* Main Content */
    .main-content {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 1000px) { .main-content { grid-template-columns: 1fr; } }

    /* Calendar Section */
    .calendar-section {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 1.5rem;
    }

    .calendar-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .cal-nav-btn {
      width: 36px; height: 36px;
      border-radius: 10px; border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .cal-nav-btn:hover { background: rgba(255, 255, 255, 0.2); }
    .cal-nav-btn svg { width: 18px; height: 18px; }

    .cal-month-title {
      flex: 1;
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      text-align: center;
      text-transform: capitalize;
    }

    .today-btn {
      padding: 0.5rem 1rem;
      border-radius: 8px; border: none;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      font-weight: 500; cursor: pointer;
      transition: all 0.2s;
    }
    .today-btn:hover { background: rgba(99, 102, 241, 0.3); }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }

    .weekday-header {
      text-align: center;
      font-size: 0.7rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.4);
      padding: 0.5rem 0;
      text-transform: uppercase;
    }

    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      gap: 2px;
    }
    .calendar-day:hover { background: rgba(255, 255, 255, 0.1); }
    .calendar-day.other-month { opacity: 0.3; }
    .calendar-day.today { 
      background: rgba(99, 102, 241, 0.2); 
      box-shadow: inset 0 0 0 2px #6366F1;
    }
    .calendar-day.selected { 
      background: linear-gradient(135deg, #6366F1, #8B5CF6); 
    }
    .calendar-day.has-reservations .day-number { font-weight: 700; }

    .day-number { font-size: 0.9rem; line-height: 1; }

    .day-dots {
      display: flex;
      gap: 2px;
      height: 6px;
      align-items: center;
    }

    .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #6366F1;
    }
    .dot.confirmada { background: #10B981; }
    .dot.pendiente { background: #F59E0B; }
    .dot.completada { background: #8B5CF6; }
    .dot.cancelada { background: #EF4444; }

    .dot-more {
      font-size: 0.5rem;
      color: rgba(255,255,255,0.6);
    }

    .calendar-legend {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.6);
    }

    /* Day Detail Section */
    .day-detail-section {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 1.5rem;
      max-height: 500px;
      overflow-y: auto;
    }

    .day-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .day-detail-header h3 { margin: 0; font-size: 1.1rem; text-transform: capitalize; }
    .res-count { 
      background: rgba(99, 102, 241, 0.2); 
      padding: 0.25rem 0.75rem; 
      border-radius: 20px; 
      font-size: 0.8rem;
      color: #a5b4fc;
    }

    .time-grid { display: flex; flex-direction: column; gap: 2px; }

    .time-row {
      display: flex;
      gap: 1rem;
      padding: 0.5rem;
      border-radius: 10px;
      transition: all 0.2s;
      cursor: pointer;
      min-height: 48px;
      align-items: flex-start;
    }
    .time-row:hover { background: rgba(255, 255, 255, 0.05); }
    .time-row.has-reservation { background: rgba(99, 102, 241, 0.05); }

    .time-label {
      width: 50px;
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.4);
      padding-top: 0.25rem;
    }

    .time-content { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }

    .empty-slot {
      color: rgba(255, 255, 255, 0.3);
      font-size: 0.8rem;
      padding: 0.25rem 0;
    }

    .mini-res-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.15);
      border-left: 3px solid #6366F1;
    }
    .mini-res-card.confirmada { background: rgba(16, 185, 129, 0.15); border-color: #10B981; }
    .mini-res-card.pendiente { background: rgba(245, 158, 11, 0.15); border-color: #F59E0B; }
    .mini-res-card.completada { background: rgba(139, 92, 246, 0.1); border-color: #8B5CF6; opacity: 0.7; }
    .mini-res-card.cancelada { background: rgba(239, 68, 68, 0.1); border-color: #EF4444; opacity: 0.5; text-decoration: line-through; }

    .mini-res-info { display: flex; flex-direction: column; gap: 2px; }
    .mini-res-name { font-weight: 600; font-size: 0.875rem; }
    .mini-res-details { font-size: 0.75rem; color: rgba(255,255,255,0.6); }

    .mini-res-actions { display: flex; gap: 0.25rem; }
    .mini-btn {
      width: 28px; height: 28px;
      border-radius: 6px; border: none;
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer; font-size: 0.75rem;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .mini-btn:hover { background: rgba(255, 255, 255, 0.2); }
    .mini-btn.confirm:hover { background: rgba(16, 185, 129, 0.3); }

    /* Tables Quick Section */
    .tables-quick-section {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 1.25rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .section-header h3 { margin: 0; font-size: 1rem; }
    .quick-stats { font-size: 0.8rem; color: rgba(255,255,255,0.5); }

    .tables-quick-grid {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .table-quick-card {
      width: 60px; height: 60px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
      background: rgba(255, 255, 255, 0.05);
    }
    .table-quick-card:hover { transform: scale(1.05); }
    .table-quick-card.disponible { border-color: #10B981; background: rgba(16, 185, 129, 0.1); }
    .table-quick-card.reservada { border-color: #F59E0B; background: rgba(245, 158, 11, 0.1); }
    .table-quick-card.ocupada { border-color: #6366F1; background: rgba(99, 102, 241, 0.2); }
    .table-quick-card.mantenimiento { border-color: #EF4444; opacity: 0.4; }

    .table-num { font-weight: 700; font-size: 1.1rem; }
    .table-cap { font-size: 0.7rem; color: rgba(255,255,255,0.5); }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 24px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .modal-content.modal-sm { max-width: 420px; }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .modal-header h2 { margin: 0; font-size: 1.25rem; }
    .modal-close {
      width: 36px; height: 36px;
      border-radius: 10px; border: none;
      background: rgba(255,255,255,0.1);
      color: white; cursor: pointer;
      font-size: 1.25rem;
    }

    .modal-form { padding: 1rem 1.5rem; }

    .form-section {
      margin-bottom: 1.5rem;
    }
    .form-section h4 {
      margin: 0 0 1rem;
      font-size: 0.9rem;
      color: rgba(255,255,255,0.7);
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }

    .form-group { margin-bottom: 0.75rem; }
    .form-group label { 
      display: block; 
      margin-bottom: 0.4rem; 
      font-size: 0.8rem;
      font-weight: 500;
      color: rgba(255,255,255,0.6);
    }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; padding: 0.75rem 1rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.05);
      color: white; font-size: 0.95rem;
      transition: all 0.2s;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none;
      border-color: #6366F1;
      background: rgba(99, 102, 241, 0.1);
    }

    .people-selector {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .people-btn {
      width: 40px; height: 40px;
      border-radius: 10px; border: none;
      background: rgba(255,255,255,0.1);
      color: white; cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    .people-btn:hover { background: rgba(255,255,255,0.2); }
    .people-btn.active { 
      background: linear-gradient(135deg, #6366F1, #8B5CF6); 
    }

    .tables-selector {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.5rem;
    }
    .table-option {
      padding: 0.75rem;
      border-radius: 10px;
      border: 2px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      color: white;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.2s;
    }
    .table-option:hover { border-color: rgba(255,255,255,0.3); }
    .table-option.active { 
      border-color: #6366F1; 
      background: rgba(99, 102, 241, 0.15);
    }
    .table-opt-icon { font-size: 1.5rem; }
    .table-opt-num { font-weight: 700; font-size: 1.1rem; }
    .table-opt-cap { font-size: 0.7rem; color: rgba(255,255,255,0.5); }

    .modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .footer-right { display: flex; gap: 0.75rem; }

    .btn-primary, .btn-secondary, .btn-danger {
      padding: 0.75rem 1.5rem;
      border-radius: 10px; border: none;
      font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary { 
      background: linear-gradient(135deg, #6366F1, #8B5CF6); 
      color: white; 
    }
    .btn-secondary { background: rgba(255,255,255,0.1); color: white; }
    .btn-danger { background: rgba(239, 68, 68, 0.2); color: #f87171; }

    /* View Reservation Modal */
    .view-res-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-radius: 24px 24px 0 0;
    }
    .view-res-header.confirmada { background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(52, 211, 153, 0.2)); }
    .view-res-header.pendiente { background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.2)); }
    .view-res-header.completada { background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(167, 139, 250, 0.2)); }
    .view-res-header.cancelada { background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(248, 113, 113, 0.2)); }

    .view-res-status { font-weight: 600; }

    .view-res-body { padding: 1.5rem; }
    .view-res-body h2 { margin: 0 0 1rem; }

    .view-res-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    .info-icon { font-size: 1rem; }

    .view-res-notes {
      margin-top: 1rem;
      padding: 1rem;
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
    }
    .view-res-notes strong { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; }
    .view-res-notes p { margin: 0; color: rgba(255,255,255,0.8); }

    .view-res-actions {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      flex-wrap: wrap;
    }
    .view-res-actions .action-btn { flex: 1; min-width: 100px; text-align: center; }

    /* Customer Modal Styles */
    .customer-modal { max-width: 700px; }

    .customer-search-section {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .customer-search-input {
      width: 100%;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.05);
      color: white;
      font-size: 1rem;
      margin-bottom: 0.75rem;
    }
    .customer-search-input:focus {
      outline: none;
      border-color: #EC4899;
      background: rgba(236, 72, 153, 0.1);
    }

    .customer-filters {
      display: flex;
      gap: 0.5rem;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: none;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
    }
    .filter-btn:hover { background: rgba(255,255,255,0.15); }
    .filter-btn.active { 
      background: linear-gradient(135deg, #EC4899, #DB2777);
      color: white;
    }

    .customer-list {
      padding: 1rem;
      max-height: 400px;
      overflow-y: auto;
    }

    .customer-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .customer-card:hover {
      background: rgba(236, 72, 153, 0.1);
      border-color: rgba(236, 72, 153, 0.3);
      transform: translateX(5px);
    }

    .customer-avatar {
      width: 50px; height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .customer-info { flex: 1; }

    .customer-name-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .customer-name { font-weight: 600; font-size: 0.95rem; }
    
    .customer-tier {
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 10px;
      background: rgba(255,255,255,0.1);
    }
    .customer-tier.vip { background: rgba(234, 179, 8, 0.2); color: #FDE047; }
    .customer-tier.gold { background: rgba(234, 179, 8, 0.15); color: #FBBF24; }
    .customer-tier.silver { background: rgba(168, 162, 158, 0.2); color: #D6D3D1; }
    .customer-tier.bronze { background: rgba(180, 83, 9, 0.2); color: #FB923C; }

    .customer-details {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.5);
      margin-bottom: 0.25rem;
    }

    .customer-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.6);
    }

    .select-customer-btn {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: none;
      background: rgba(99, 102, 241, 0.2);
      color: #A5B4FC;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .select-customer-btn:hover {
      background: #6366F1;
      color: white;
    }

    .no-customers {
      text-align: center;
      padding: 2rem;
      color: rgba(255,255,255,0.4);
    }
  `]
})
export class ReservationsComponent implements OnInit {
  private authService = inject(AuthService);
  private reservationsService = inject(ReservationsService);

  // Multi-industry service types configuration
  serviceTypes: ServiceType[] = [
    { id: '1', codigo: 'MESA', nombre: 'Mesa', icono: '🍽️', duracionDefault: 90, color: '#6366F1', industria: 'restaurante' },
    { id: '2', codigo: 'SILLA', nombre: 'Silla', icono: '💇', duracionDefault: 45, color: '#EC4899', industria: 'salon' },
    { id: '3', codigo: 'DOMICILIO', nombre: 'A Domicilio', icono: '🏠', duracionDefault: 60, color: '#10B981', industria: 'general' },
    { id: '4', codigo: 'CONSULTORIO', nombre: 'Consultorio', icono: '🏥', duracionDefault: 30, color: '#3B82F6', industria: 'clinica' },
    { id: '5', codigo: 'PUESTO', nombre: 'Puesto', icono: '💼', duracionDefault: 60, color: '#F59E0B', industria: 'oficina' },
    { id: '6', codigo: 'SALA', nombre: 'Sala', icono: '🎬', duracionDefault: 120, color: '#8B5CF6', industria: 'general' },
  ];

  // Demo customers with loyalty tiers
  customers = signal<Customer[]>([
    { id: '1', nombre: 'María González', telefono: '+56912345678', email: 'maria@email.com', tier: 'vip', visitas: 24, gastoTotal: 450000, ultimaVisita: '2026-01-15' },
    { id: '2', nombre: 'Juan Pérez', telefono: '+56987654321', email: 'juan@email.com', tier: 'gold', visitas: 15, gastoTotal: 280000, ultimaVisita: '2026-01-18' },
    { id: '3', nombre: 'Ana Martínez', telefono: '+56911223344', tier: 'silver', visitas: 8, gastoTotal: 120000, ultimaVisita: '2026-01-10' },
    { id: '4', nombre: 'Carlos López', telefono: '+56955667788', tier: 'bronze', visitas: 3, gastoTotal: 45000 },
    { id: '5', nombre: 'Patricia Díaz', telefono: '+56944556677', email: 'paty@email.com', tier: 'gold', visitas: 12, gastoTotal: 220000 },
  ]);

  // State signals
  selectedServiceTypeId = signal<string>('1');
  showCustomerModal = signal(false);
  customerSearchQuery = signal('');
  selectedCustomer = signal<Customer | null>(null);
  customerFilter = signal<'todos' | 'vip' | 'frecuentes'>('todos');

  currentMonth = signal(new Date());
  selectedDate = signal(new Date());
  showModal = signal(false);
  editingReservation = signal<Reservation | null>(null);
  viewingReservation = signal<Reservation | null>(null);

  timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

  formData = this.getEmptyForm();

  // Demo reservations
  reservations = signal<Reservation[]>([
    { id: '1', cliente: 'María González', telefono: '+56912345678', fecha: this.getTodayStr(), hora: '13:00', duracion: 90, personas: 4, recurso: '5', tipoServicio: 'mesa', estado: 'confirmada', createdAt: new Date() },
    { id: '2', cliente: 'Juan Pérez', telefono: '+56987654321', fecha: this.getTodayStr(), hora: '14:30', duracion: 60, personas: 2, recurso: '3', tipoServicio: 'mesa', estado: 'confirmada', notas: 'Aniversario - traer postre especial', createdAt: new Date() },
    { id: '3', cliente: 'Ana Martínez', telefono: '+56911223344', fecha: this.getTodayStr(), hora: '19:00', duracion: 120, personas: 8, recurso: '10', tipoServicio: 'mesa', estado: 'pendiente', notas: 'Cumpleaños', createdAt: new Date() },
    { id: '4', cliente: 'Carlos López', telefono: '+56955667788', fecha: this.getTodayStr(), hora: '20:00', duracion: 90, personas: 6, estado: 'pendiente', createdAt: new Date() },
    { id: '5', cliente: 'Patricia Díaz', telefono: '+56944556677', fecha: this.getTodayStr(), hora: '21:00', duracion: 90, personas: 4, recurso: '7', tipoServicio: 'mesa', estado: 'confirmada', createdAt: new Date() },
    { id: '6', cliente: 'Roberto Silva', telefono: '+56933445566', fecha: this.getTomorrowStr(), hora: '20:00', duracion: 120, personas: 10, recurso: '10', tipoServicio: 'mesa', estado: 'pendiente', notas: 'Reunión de trabajo', createdAt: new Date() },
  ]);

  // Demo resources (tables, chairs, rooms, etc.)
  resources = signal<Resource[]>([
    { id: '1', numero: '1', capacidad: 2, tipo: 'mesa', ubicacion: 'interior', estado: 'disponible' },
    { id: '2', numero: '2', capacidad: 2, tipo: 'mesa', ubicacion: 'interior', estado: 'disponible' },
    { id: '3', numero: '3', capacidad: 2, tipo: 'mesa', ubicacion: 'interior', estado: 'reservada' },
    { id: '4', numero: '4', capacidad: 4, tipo: 'mesa', ubicacion: 'interior', estado: 'ocupada' },
    { id: '5', numero: '5', capacidad: 4, tipo: 'mesa', ubicacion: 'interior', estado: 'reservada' },
    { id: '6', numero: '6', capacidad: 4, tipo: 'mesa', ubicacion: 'terraza', estado: 'disponible' },
    { id: '7', numero: '7', capacidad: 4, tipo: 'mesa', ubicacion: 'terraza', estado: 'reservada' },
    { id: '8', numero: '8', capacidad: 6, tipo: 'mesa', ubicacion: 'terraza', estado: 'disponible' },
    { id: '9', numero: '9', capacidad: 6, tipo: 'mesa', ubicacion: 'privado', estado: 'disponible' },
    { id: '10', numero: '10', capacidad: 10, tipo: 'mesa', ubicacion: 'privado', estado: 'reservada' },
  ]);

  // Alias for backward compatibility
  tables = this.resources;

  // Computed - Core
  todayReservations = computed(() => this.reservations().filter(r => r.fecha === this.getTodayStr()).length);
  confirmedCount = computed(() => this.reservations().filter(r => r.estado === 'confirmada').length);
  pendingCount = computed(() => this.reservations().filter(r => r.estado === 'pendiente').length);
  availableTablesCount = computed(() => this.tables().filter(t => t.estado === 'disponible').length);
  availableTables = computed(() => this.tables().filter(t => t.estado === 'disponible'));

  // Computed - Premium features
  selectedServiceType = computed(() => this.serviceTypes.find(s => s.id === this.selectedServiceTypeId()) || null);
  availableResourcesCount = computed(() => this.resources().filter(r => r.estado === 'disponible').length);

  estimatedRevenue = computed(() => {
    const today = this.getTodayStr();
    return this.reservations()
      .filter(r => r.fecha === today && r.estado !== 'cancelada')
      .reduce((sum, r) => sum + (r.precioEstimado || r.personas * 15000), 0);
  });

  filteredCustomers = computed(() => {
    const query = this.customerSearchQuery().toLowerCase();
    const filter = this.customerFilter();

    return this.customers().filter(c => {
      const matchesQuery = !query || c.nombre.toLowerCase().includes(query) || c.telefono.includes(query);
      const matchesFilter = filter === 'todos' ||
        (filter === 'vip' && c.tier === 'vip') ||
        (filter === 'frecuentes' && c.visitas >= 5);
      return matchesQuery && matchesFilter;
    });
  });

  selectedDayReservations = computed(() => {
    const dateStr = this.selectedDate().toISOString().split('T')[0];
    return this.reservations()
      .filter(r => r.fecha === dateStr)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  });

  currentMonthName = computed(() => {
    return this.currentMonth().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed(() => {
    const month = this.currentMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startOffset = firstDay.getDay();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = this.selectedDate();
    selected.setHours(0, 0, 0, 0);

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, monthIndex, -i);
      days.push(this.createCalendarDay(date, false, today, selected));
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, monthIndex, d);
      days.push(this.createCalendarDay(date, true, today, selected));
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, monthIndex + 1, i);
      days.push(this.createCalendarDay(date, false, today, selected));
    }

    return days;
  });

  ngOnInit() { }

  private createCalendarDay(date: Date, isCurrentMonth: boolean, today: Date, selected: Date): CalendarDay {
    const dateStr = date.toISOString().split('T')[0];
    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday: date.getTime() === today.getTime(),
      isSelected: date.getTime() === selected.getTime(),
      reservations: this.reservations().filter(r => r.fecha === dateStr)
    };
  }

  private getTodayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getTomorrowStr(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  private getEmptyForm() {
    return {
      cliente: '',
      telefono: '',
      email: '',
      fecha: this.getTodayStr(),
      hora: '19:00',
      duracion: 90,
      personas: 2,
      tipoServicio: '',
      recurso: '',
      notas: ''
    };
  }

  selectDate(date: Date) {
    this.selectedDate.set(date);
  }

  prevMonth() {
    const m = new Date(this.currentMonth());
    m.setMonth(m.getMonth() - 1);
    this.currentMonth.set(m);
  }

  nextMonth() {
    const m = new Date(this.currentMonth());
    m.setMonth(m.getMonth() + 1);
    this.currentMonth.set(m);
  }

  goToToday() {
    const today = new Date();
    this.currentMonth.set(today);
    this.selectedDate.set(today);
  }

  formatSelectedDate(): string {
    return this.selectedDate().toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }

  getReservationsForTime(slot: string): Reservation[] {
    const hour = parseInt(slot.split(':')[0]);
    return this.selectedDayReservations().filter(r => {
      const resHour = parseInt(r.hora.split(':')[0]);
      return resHour === hour;
    });
  }

  openNewReservation() {
    this.editingReservation.set(null);
    this.formData = {
      ...this.getEmptyForm(),
      fecha: this.selectedDate().toISOString().split('T')[0]
    };
    this.showModal.set(true);
  }

  openNewReservationAtTime(time: string) {
    this.editingReservation.set(null);
    this.formData = {
      ...this.getEmptyForm(),
      fecha: this.selectedDate().toISOString().split('T')[0],
      hora: time
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingReservation.set(null);
  }

  viewReservation(res: Reservation) {
    this.viewingReservation.set(res);
  }

  editReservation(res: Reservation) {
    this.editingReservation.set(res);
    this.formData = {
      cliente: res.cliente,
      telefono: res.telefono,
      email: res.email || '',
      fecha: res.fecha,
      hora: res.hora,
      duracion: res.duracion,
      personas: res.personas,
      tipoServicio: res.tipoServicio || '',
      recurso: res.recurso || '',
      notas: res.notas || ''
    };
    this.showModal.set(true);
  }

  saveReservation() {
    if (!this.formData.cliente || !this.formData.telefono) return;

    if (this.editingReservation()) {
      this.reservations.update(list => list.map(r =>
        r.id === this.editingReservation()!.id
          ? { ...r, ...this.formData, recurso: this.formData.recurso || undefined, notas: this.formData.notas || undefined }
          : r
      ));
    } else {
      const res: Reservation = {
        id: crypto.randomUUID(),
        cliente: this.formData.cliente,
        telefono: this.formData.telefono,
        email: this.formData.email || undefined,
        fecha: this.formData.fecha,
        hora: this.formData.hora,
        duracion: this.formData.duracion,
        personas: this.formData.personas,
        recurso: this.formData.recurso || undefined,
        estado: 'pendiente',
        notas: this.formData.notas || undefined,
        createdAt: new Date()
      };
      this.reservations.update(list => [res, ...list]);
    }

    this.closeModal();
  }

  deleteReservation() {
    if (this.editingReservation() && confirm('¿Eliminar esta reserva?')) {
      this.reservations.update(list => list.filter(r => r.id !== this.editingReservation()!.id));
      this.closeModal();
    }
  }

  confirmReservation(res: Reservation) {
    this.reservations.update(list => list.map(r => r.id === res.id ? { ...r, estado: 'confirmada' as const } : r));
  }

  completeReservation(res: Reservation) {
    this.reservations.update(list => list.map(r => r.id === res.id ? { ...r, estado: 'completada' as const } : r));
  }

  cancelReservation(res: Reservation) {
    if (confirm('¿Cancelar esta reserva?')) {
      this.reservations.update(list => list.map(r => r.id === res.id ? { ...r, estado: 'cancelada' as const } : r));
    }
  }

  toggleResourceStatus(resource: Resource) {
    const statusFlow: Record<string, Resource['estado']> = {
      'disponible': 'reservada',
      'reservada': 'ocupada',
      'ocupada': 'disponible',
      'mantenimiento': 'disponible'
    };
    this.resources.update(list => list.map(r =>
      r.id === resource.id ? { ...r, estado: statusFlow[r.estado] } : r
    ));
  }

  getStatusIcon(estado: string): string {
    const icons: Record<string, string> = {
      'confirmada': '✅',
      'pendiente': '⏳',
      'cancelada': '❌',
      'completada': '🏁',
      'no_show': '👻'
    };
    return icons[estado] || '';
  }

  getStatusLabel(estado: string): string {
    const labels: Record<string, string> = {
      'confirmada': 'Confirmada',
      'pendiente': 'Pendiente',
      'cancelada': 'Cancelada',
      'completada': 'Completada',
      'no_show': 'No se presentó'
    };
    return labels[estado] || estado;
  }

  getLocationEmoji(ubicacion: string): string {
    const emojis: Record<string, string> = {
      'interior': '🏠',
      'terraza': '☀️',
      'privado': '🚪'
    };
    return emojis[ubicacion] || '';
  }

  // Premium helper methods
  selectServiceType(svc: ServiceType): void {
    this.selectedServiceTypeId.set(svc.id);
    this.formData.tipoServicio = svc.codigo;
    this.formData.duracion = svc.duracionDefault;
  }

  getResourceIcon(): string {
    const svc = this.selectedServiceType();
    return svc?.icono || '🪑';
  }

  getResourceLabel(): string {
    const svc = this.selectedServiceType();
    const labels: Record<string, string> = {
      'MESA': 'Mesas',
      'SILLA': 'Sillas',
      'CONSULTORIO': 'Consultorios',
      'PUESTO': 'Puestos',
      'SALA': 'Salas',
      'DOMICILIO': 'Cupos'
    };
    return labels[svc?.codigo || ''] || 'Recursos';
  }

  formatRevenue(amount: number): string {
    return '$' + amount.toLocaleString('es-CL');
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.formData.cliente = customer.nombre;
    this.formData.telefono = customer.telefono;
    this.formData.email = customer.email || '';
    this.showCustomerModal.set(false);
  }

  getTierIcon(tier: Customer['tier']): string {
    const icons: Record<string, string> = {
      'vip': '⭐',
      'gold': '🥇',
      'silver': '🥈',
      'bronze': '🥉',
      'nuevo': '🆕'
    };
    return icons[tier] || '';
  }

  getTierLabel(tier: Customer['tier']): string {
    const labels: Record<string, string> = {
      'vip': 'VIP',
      'gold': 'Gold',
      'silver': 'Silver',
      'bronze': 'Bronze',
      'nuevo': 'Nuevo'
    };
    return labels[tier] || tier;
  }
}
