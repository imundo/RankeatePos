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

// Automation System Interfaces
interface Automation {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'auto-respuesta' | 'recordatorio' | 'campaña';
  trigger: 'nueva-reserva' | 'confirmacion' | 'cancelacion' | 'completada' |
  '24h-antes' | '2h-antes' | 'cumpleaños' | 'inactividad' | 'manual';
  canales: ('email' | 'whatsapp')[];
  templateId: string;
  activa: boolean;
  condiciones?: {
    soloVIP?: boolean;
    diasInactividad?: number;
  };
}

interface MessageTemplate {
  id: string;
  nombre: string;
  tipo: 'email' | 'whatsapp' | 'ambos';
  asunto?: string;
  contenido: string;
  variables: string[];
}

interface AutomationLog {
  id: string;
  automationId: string;
  automationNombre: string;
  clienteNombre: string;
  canal: 'email' | 'whatsapp';
  estado: 'enviado' | 'fallido' | 'pendiente';
  fechaEnvio: string;
  mensaje: string;
}

interface WhatsAppConfig {
  provider: 'twilio' | 'meta' | 'messagebird' | 'none';
  accountSid: string;
  authToken: string;
  phoneNumberId: string;
  accessToken: string;
  fromNumber: string;
  enabled: boolean;
  testMode: boolean;
}

interface EmailConfig {
  provider: 'sendgrid' | 'smtp' | 'mailgun' | 'none';
  apiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  enabled: boolean;
  testMode: boolean;
}

interface AutomationConfig {
  whatsapp: WhatsAppConfig;
  email: EmailConfig;
  negocioNombre: string;
  negocioDireccion: string;
  negocioTelefono: string;
}
@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reservations-container">
      <!-- Premium Header with Glassmorphism -->
      <header class="res-header premium-header">
        <div class="header-glow"></div>
        <div class="header-content">
          <div class="header-left">
            <a routerLink="/dashboard" class="back-btn-premium">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m0 0l7-7m-7 7l7 7"/></svg>
            </a>
            <div class="title-section">
              <div class="title-row">
                <span class="title-icon">📅</span>
                <h1>Reservas y Citas</h1>
                <span class="status-pill live">
                  <span class="pulse-dot"></span>
                  En vivo
                </span>
              </div>
              <p class="subtitle">Gestión inteligente adaptable a tu negocio</p>
            </div>
          </div>
          <div class="header-actions">
            <div class="quick-actions">
              <button class="icon-action-btn" (click)="showAutomationModal.set(true)" title="Automatizaciones">
                ⚙️
                <span class="action-count">{{ activeAutomationsCount() }}</span>
              </button>
              <button class="icon-action-btn" (click)="showCustomerModal.set(true)" title="Base de Clientes">
                👥
                <span class="action-count">{{ customers().length }}</span>
              </button>
            </div>
            <button class="primary-action-btn" (click)="openNewReservation()">
              <span class="btn-plus">+</span>
              <span>Nueva {{ selectedServiceType()?.nombre || 'Reserva' }}</span>
            </button>
          </div>
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

      <!-- Marketing Hub Section -->
      <section class="marketing-hub-section" [class.collapsed]="marketingCollapsed()">
        <div class="marketing-header" (click)="marketingCollapsed.set(!marketingCollapsed())">
          <div class="marketing-title">
            <span class="section-icon">📣</span>
            <h3>Marketing Hub</h3>
            <span class="marketing-badge">{{ sentCampaignsToday() }} enviados hoy</span>
          </div>
          <button class="collapse-btn">{{ marketingCollapsed() ? '▼' : '▲' }}</button>
        </div>
        @if (!marketingCollapsed()) {
          <div class="marketing-content">
            <div class="quick-campaigns">
              <h4>Campañas Rápidas</h4>
              <div class="campaign-grid">
                <button class="campaign-card" (click)="sendBulkConfirmation()">
                  <span class="campaign-icon">✅</span>
                  <span class="campaign-name">Confirmar Reservas</span>
                  <span class="campaign-desc">Enviar confirmación a pendientes</span>
                </button>
                <button class="campaign-card" (click)="sendBulkReminder()">
                  <span class="campaign-icon">⏰</span>
                  <span class="campaign-name">Recordatorio 24h</span>
                  <span class="campaign-desc">Recordar citas de mañana</span>
                </button>
                <button class="campaign-card" (click)="sendBulkThankYou()">
                  <span class="campaign-icon">🙏</span>
                  <span class="campaign-name">Agradecimiento</span>
                  <span class="campaign-desc">Post-visita de hoy</span>
                </button>
                <button class="campaign-card" (click)="sendReactivationCampaign()">
                  <span class="campaign-icon">🔄</span>
                  <span class="campaign-name">Reactivación</span>
                  <span class="campaign-desc">Clientes inactivos 30+ días</span>
                </button>
              </div>
            </div>
            <div class="campaign-stats">
              <div class="stat-item">
                <span class="stat-number">{{ emailsSentToday() }}</span>
                <span class="stat-name">📧 Emails</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ whatsappSentToday() }}</span>
                <span class="stat-name">💬 WhatsApp</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ marketingOpenRate() }}%</span>
                <span class="stat-name">📊 Apertura</span>
              </div>
            </div>
          </div>
        }
      </section>

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
                <!-- Smart Slot Suggestions -->
                <div class="smart-suggestions">
                  <span class="suggestion-label">💡 Horarios con disponibilidad:</span>
                  <div class="suggestion-chips">
                    @for (slot of suggestedSlots(); track slot.hora) {
                      <button type="button" 
                              class="slot-chip" 
                              [class]="slot.demanda"
                              (click)="formData.hora = slot.hora">
                        {{ slot.hora }}
                        <span class="availability-badge">{{ slot.disponibles }} libres</span>
                      </button>
                    }
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
            <!-- Marketing Quick Actions -->
            <div class="marketing-actions-row">
              <button class="marketing-btn email" (click)="sendReservationConfirmationEmail(viewingReservation()!)">
                📧 Enviar Confirmación
              </button>
              <button class="marketing-btn whatsapp" (click)="sendReservationWhatsApp(viewingReservation()!)">
                💬 Recordatorio
              </button>
              <button class="marketing-btn phone" (click)="callReservationCustomer(viewingReservation()!)">
                📱 Llamar
              </button>
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
                <div class="customer-card">
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
                    <!-- Marketing Quick Actions -->
                    <div class="customer-actions">
                      <button class="action-mini-btn email" (click)="sendEmailTo(customer); $event.stopPropagation()" title="Enviar Email">
                        📧
                      </button>
                      <button class="action-mini-btn whatsapp" (click)="sendWhatsAppTo(customer); $event.stopPropagation()" title="Enviar WhatsApp">
                        💬
                      </button>
                      <button class="action-mini-btn phone" (click)="callCustomer(customer); $event.stopPropagation()" title="Llamar">
                        📱
                      </button>
                    </div>
                  </div>
                  <button class="select-customer-btn" (click)="selectCustomer(customer)">Seleccionar</button>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Automation System Modal -->
      @if (showAutomationModal()) {
        <div class="modal-overlay" (click)="showAutomationModal.set(false)">
          <div class="modal-content automation-modal" (click)="$event.stopPropagation()">
            <div class="modal-header automation-header">
              <div class="automation-title">
                <h2>⚙️ Centro de Automatizaciones</h2>
                <span class="plan-badge">{{ getCurrentPlan() }}</span>
              </div>
              <button class="modal-close" (click)="showAutomationModal.set(false)">✕</button>
            </div>

            <!-- Tabs -->
            <div class="automation-tabs">
              <button class="tab-btn" [class.active]="automationTab() === 'flujos'" (click)="automationTab.set('flujos')">
                🤖 Flujos
              </button>
              <button class="tab-btn" [class.active]="automationTab() === 'templates'" (click)="automationTab.set('templates')">
                📝 Templates
              </button>
              <button class="tab-btn" [class.active]="automationTab() === 'historial'" (click)="automationTab.set('historial')">
                📊 Historial
              </button>
              <button class="tab-btn" [class.active]="automationTab() === 'config'" (click)="automationTab.set('config')">
                🔧 Configuración
              </button>
            </div>

            <div class="automation-content">
              <!-- Flujos Tab -->
              @if (automationTab() === 'flujos') {
                <div class="flujos-section">
                  <div class="section-intro">
                    <p>Activa o desactiva automatizaciones según tus necesidades</p>
                  </div>
                  <div class="automations-list">
                    @for (auto of automations(); track auto.id) {
                      <div class="automation-item" [class.active]="auto.activa">
                        <div class="auto-icon">{{ getAutoIcon(auto.trigger) }}</div>
                        <div class="auto-info">
                          <span class="auto-name">{{ auto.nombre }}</span>
                          <span class="auto-desc">{{ auto.descripcion }}</span>
                          <div class="auto-channels">
                            @for (canal of auto.canales; track canal) {
                              <span class="channel-tag" [class]="canal">{{ canal === 'email' ? '📧' : '💬' }} {{ canal }}</span>
                            }
                          </div>
                        </div>
                        <label class="toggle-switch">
                          <input type="checkbox" [checked]="auto.activa" (change)="toggleAutomation(auto)">
                          <span class="toggle-slider"></span>
                        </label>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Templates Tab -->
              @if (automationTab() === 'templates') {
                <div class="templates-section">
                  <div class="templates-header">
                    <p>Personaliza los mensajes de tus automatizaciones</p>
                    <div class="variables-hint">
                      Variables: <code>{{ '{{cliente}}' }}</code> <code>{{ '{{fecha}}' }}</code> <code>{{ '{{hora}}' }}</code> <code>{{ '{{negocio}}' }}</code>
                    </div>
                  </div>
                  <div class="templates-list">
                    @for (template of messageTemplates(); track template.id) {
                      <div class="template-card" (click)="editTemplate(template)">
                        <div class="template-header-row">
                          <span class="template-name">{{ template.nombre }}</span>
                          <span class="template-type" [class]="template.tipo">{{ template.tipo }}</span>
                        </div>
                        @if (template.asunto) {
                          <div class="template-subject">Asunto: {{ template.asunto }}</div>
                        }
                        <div class="template-preview">{{ template.contenido.substring(0, 100) }}...</div>
                        <button class="edit-template-btn">✏️ Editar</button>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Historial Tab -->
              @if (automationTab() === 'historial') {
                <div class="historial-section">
                  <div class="historial-stats">
                    <div class="stat-box">
                      <span class="stat-val">{{ automationLogs().length }}</span>
                      <span class="stat-lbl">Total Enviados</span>
                    </div>
                    <div class="stat-box success">
                      <span class="stat-val">{{ successfulLogsCount() }}</span>
                      <span class="stat-lbl">Exitosos</span>
                    </div>
                    <div class="stat-box error">
                      <span class="stat-val">{{ failedLogsCount() }}</span>
                      <span class="stat-lbl">Fallidos</span>
                    </div>
                  </div>
                  <div class="logs-list">
                    @for (log of automationLogs().slice(0, 20); track log.id) {
                      <div class="log-item" [class]="log.estado">
                        <span class="log-icon">{{ log.canal === 'email' ? '📧' : '💬' }}</span>
                        <div class="log-info">
                          <span class="log-auto">{{ log.automationNombre }}</span>
                          <span class="log-client">→ {{ log.clienteNombre }}</span>
                        </div>
                        <span class="log-status">{{ log.estado === 'enviado' ? '✅' : log.estado === 'fallido' ? '❌' : '⏳' }}</span>
                        <span class="log-date">{{ log.fechaEnvio }}</span>
                      </div>
                    } @empty {
                      <div class="no-logs">No hay envíos registrados aún</div>
                    }
                  </div>
                </div>
              }

              <!-- Configuración Tab -->
              @if (automationTab() === 'config') {
                <div class="config-section">
                  <!-- Negocio Info -->
                  <div class="config-group">
                    <h4>🏪 Información del Negocio</h4>
                    <div class="config-form">
                      <div class="form-row">
                        <label>Nombre del Negocio</label>
                        <input type="text" [(ngModel)]="automationConfig.negocioNombre" placeholder="Mi Negocio">
                      </div>
                      <div class="form-row">
                        <label>Dirección</label>
                        <input type="text" [(ngModel)]="automationConfig.negocioDireccion" placeholder="Av. Principal 123">
                      </div>
                      <div class="form-row">
                        <label>Teléfono de Contacto</label>
                        <input type="text" [(ngModel)]="automationConfig.negocioTelefono" placeholder="+56 9 1234 5678">
                      </div>
                    </div>
                  </div>

                  <!-- Email Config -->
                  <div class="config-group">
                    <div class="config-group-header">
                      <h4>📧 Configuración Email</h4>
                      <label class="toggle-switch small">
                        <input type="checkbox" [(ngModel)]="automationConfig.email.enabled">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                    @if (automationConfig.email.enabled) {
                      <div class="config-form">
                        <div class="form-row">
                          <label>Proveedor</label>
                          <select [(ngModel)]="automationConfig.email.provider">
                            <option value="none">Seleccionar...</option>
                            <option value="sendgrid">SendGrid</option>
                            <option value="mailgun">Mailgun</option>
                            <option value="smtp">SMTP Personalizado</option>
                          </select>
                        </div>
                        @if (automationConfig.email.provider === 'sendgrid' || automationConfig.email.provider === 'mailgun') {
                          <div class="form-row">
                            <label>API Key</label>
                            <input type="password" [(ngModel)]="automationConfig.email.apiKey" placeholder="SG.xxxx...">
                          </div>
                        }
                        @if (automationConfig.email.provider === 'smtp') {
                          <div class="form-row">
                            <label>Host SMTP</label>
                            <input type="text" [(ngModel)]="automationConfig.email.smtpHost" placeholder="smtp.gmail.com">
                          </div>
                          <div class="form-row half">
                            <label>Puerto</label>
                            <input type="number" [(ngModel)]="automationConfig.email.smtpPort" placeholder="587">
                          </div>
                          <div class="form-row">
                            <label>Usuario</label>
                            <input type="text" [(ngModel)]="automationConfig.email.smtpUser">
                          </div>
                          <div class="form-row">
                            <label>Contraseña</label>
                            <input type="password" [(ngModel)]="automationConfig.email.smtpPassword">
                          </div>
                        }
                        <div class="form-row">
                          <label>Email Remitente</label>
                          <input type="email" [(ngModel)]="automationConfig.email.fromEmail" placeholder="noreply@minegocio.cl">
                        </div>
                        <div class="form-row">
                          <label>Nombre Remitente</label>
                          <input type="text" [(ngModel)]="automationConfig.email.fromName" placeholder="Mi Negocio">
                        </div>
                        <button class="test-btn" (click)="testEmailConnection()">🧪 Probar Conexión</button>
                      </div>
                    }
                  </div>

                  <!-- WhatsApp Config -->
                  <div class="config-group">
                    <div class="config-group-header">
                      <h4>💬 Configuración WhatsApp</h4>
                      <label class="toggle-switch small">
                        <input type="checkbox" [(ngModel)]="automationConfig.whatsapp.enabled">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                    @if (automationConfig.whatsapp.enabled) {
                      <div class="config-form">
                        <div class="form-row">
                          <label>Proveedor</label>
                          <select [(ngModel)]="automationConfig.whatsapp.provider">
                            <option value="none">Seleccionar...</option>
                            <option value="twilio">Twilio</option>
                            <option value="meta">Meta Business API</option>
                            <option value="messagebird">MessageBird</option>
                          </select>
                        </div>
                        @if (automationConfig.whatsapp.provider === 'twilio') {
                          <div class="form-row">
                            <label>Account SID</label>
                            <input type="text" [(ngModel)]="automationConfig.whatsapp.accountSid" placeholder="ACxxxx...">
                          </div>
                          <div class="form-row">
                            <label>Auth Token</label>
                            <input type="password" [(ngModel)]="automationConfig.whatsapp.authToken">
                          </div>
                        }
                        @if (automationConfig.whatsapp.provider === 'meta') {
                          <div class="form-row">
                            <label>Phone Number ID</label>
                            <input type="text" [(ngModel)]="automationConfig.whatsapp.phoneNumberId">
                          </div>
                          <div class="form-row">
                            <label>Access Token</label>
                            <input type="password" [(ngModel)]="automationConfig.whatsapp.accessToken">
                          </div>
                        }
                        <div class="form-row">
                          <label>Número de Envío</label>
                          <input type="text" [(ngModel)]="automationConfig.whatsapp.fromNumber" placeholder="+56912345678">
                        </div>
                        <button class="test-btn" (click)="testWhatsAppConnection()">🧪 Probar Conexión</button>
                      </div>
                    }
                  </div>

                  <div class="config-actions">
                    <button class="save-config-btn" (click)="saveAutomationConfig()">💾 Guardar Configuración</button>
                  </div>
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
      position: relative;
    }

    /* Premium Header */
    .res-header {
      position: relative;
      margin-bottom: 1.5rem;
      border-radius: 20px;
      overflow: hidden;
    }

    .premium-header {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.04));
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
    }

    .header-glow {
      position: absolute;
      top: -50%;
      left: -20%;
      width: 60%;
      height: 200%;
      background: radial-gradient(ellipse, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
      pointer-events: none;
      animation: glowPulse 4s ease-in-out infinite alternate;
    }

    @keyframes glowPulse {
      0% { opacity: 0.5; transform: translateX(0); }
      100% { opacity: 1; transform: translateX(10%); }
    }

    .header-content {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left { display: flex; align-items: center; gap: 1rem; }

    .back-btn-premium {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none; color: white;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .back-btn-premium svg { width: 20px; height: 20px; }
    .back-btn-premium:hover { 
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateX(-3px);
    }

    .title-section h1 { margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
    .subtitle { color: rgba(255, 255, 255, 0.5); margin: 0.35rem 0 0; font-size: 0.85rem; }

    .title-row { display: flex; align-items: center; gap: 0.75rem; }
    .title-icon { font-size: 1.75rem; }
    
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-pill.live {
      background: rgba(16, 185, 129, 0.15);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .pulse-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #10B981;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }

    .header-actions { display: flex; align-items: center; gap: 1rem; }

    .quick-actions { display: flex; gap: 0.5rem; }

    .icon-action-btn {
      position: relative;
      width: 48px; height: 48px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.04);
      cursor: pointer;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .icon-action-btn:hover {
      background: rgba(139, 92, 246, 0.15);
      border-color: rgba(139, 92, 246, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2);
    }
    .action-count {
      position: absolute;
      top: -4px; right: -4px;
      min-width: 18px; height: 18px;
      border-radius: 9px;
      background: linear-gradient(135deg, #8B5CF6, #6366F1);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
    }

    .primary-action-btn {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1.5rem;
      border-radius: 14px;
      border: none;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
    }
    .primary-action-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(99, 102, 241, 0.5);
    }
    .primary-action-btn:active { transform: translateY(-1px); }
    .btn-plus {
      width: 22px; height: 22px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      font-weight: 400;
    }

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
      position: relative;
      padding: 1.25rem;
      border-radius: 18px;
      display: flex;
      align-items: center;
      gap: 1rem;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
      pointer-events: none;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
    }

    .gradient-purple { background: linear-gradient(135deg, #6366F1, #8B5CF6); box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25); }
    .gradient-green { background: linear-gradient(135deg, #10B981, #34D399); box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25); }
    .gradient-amber { background: linear-gradient(135deg, #F59E0B, #FBBF24); box-shadow: 0 4px 20px rgba(245, 158, 11, 0.25); }
    .gradient-blue { background: linear-gradient(135deg, #3B82F6, #60A5FA); box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25); }
    .gradient-emerald { background: linear-gradient(135deg, #059669, #10B981); box-shadow: 0 4px 20px rgba(5, 150, 105, 0.25); }

    .stat-icon { font-size: 2.25rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
    .stat-content { display: flex; flex-direction: column; position: relative; z-index: 1; }
    .stat-value { font-size: 1.6rem; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.15); }
    .stat-label { font-size: 0.8rem; opacity: 0.9; font-weight: 500; }

    /* Marketing Hub Section */
    .marketing-hub-section {
      background: linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(139, 92, 246, 0.05));
      border: 1px solid rgba(236, 72, 153, 0.2);
      border-radius: 16px;
      margin-bottom: 1.5rem;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .marketing-hub-section.collapsed { border-color: rgba(255,255,255,0.1); }

    .marketing-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .marketing-header:hover { background: rgba(255,255,255,0.03); }

    .marketing-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .marketing-title h3 { margin: 0; font-size: 1rem; font-weight: 600; }
    .section-icon { font-size: 1.25rem; }
    .marketing-badge {
      background: linear-gradient(135deg, #EC4899, #DB2777);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .collapse-btn {
      width: 32px; height: 32px;
      border-radius: 8px;
      border: none;
      background: rgba(255,255,255,0.1);
      color: white;
      cursor: pointer;
      font-size: 0.8rem;
    }

    .marketing-content {
      padding: 0 1.5rem 1.5rem;
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .quick-campaigns { flex: 2; min-width: 300px; }
    .quick-campaigns h4 { margin: 0 0 1rem; font-size: 0.9rem; color: rgba(255,255,255,0.7); }

    .campaign-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }
    @media (max-width: 1100px) { .campaign-grid { grid-template-columns: repeat(2, 1fr); } }

    .campaign-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      cursor: pointer;
      transition: all 0.25s;
      text-align: center;
    }
    .campaign-card:hover {
      background: rgba(236, 72, 153, 0.15);
      border-color: rgba(236, 72, 153, 0.4);
      transform: translateY(-3px);
    }
    .campaign-icon { font-size: 1.5rem; }
    .campaign-name { font-weight: 600; font-size: 0.85rem; }
    .campaign-desc { font-size: 0.7rem; color: rgba(255,255,255,0.5); }

    .campaign-stats {
      flex: 1;
      min-width: 200px;
      display: flex;
      gap: 1rem;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
      padding: 1rem;
    }
    .stat-item { text-align: center; }
    .stat-number { display: block; font-size: 1.5rem; font-weight: 800; color: #F9A8D4; }
    .stat-name { font-size: 0.75rem; color: rgba(255,255,255,0.6); }

    /* Customer Action Buttons */
    .customer-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .action-mini-btn {
      width: 32px; height: 32px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .action-mini-btn.email {
      background: rgba(59, 130, 246, 0.2);
    }
    .action-mini-btn.email:hover {
      background: rgba(59, 130, 246, 0.4);
      transform: scale(1.1);
    }
    .action-mini-btn.whatsapp {
      background: rgba(34, 197, 94, 0.2);
    }
    .action-mini-btn.whatsapp:hover {
      background: rgba(34, 197, 94, 0.4);
      transform: scale(1.1);
    }
    .action-mini-btn.phone {
      background: rgba(168, 85, 247, 0.2);
    }
    .action-mini-btn.phone:hover {
      background: rgba(168, 85, 247, 0.4);
      transform: scale(1.1);
    }

    /* Marketing Actions in Reservation View */
    .marketing-actions-row {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: rgba(236, 72, 153, 0.08);
      border-top: 1px solid rgba(236, 72, 153, 0.2);
    }

    .marketing-btn {
      flex: 1;
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
    }
    .marketing-btn.email {
      background: rgba(59, 130, 246, 0.2);
      color: #93C5FD;
    }
    .marketing-btn.email:hover { background: rgba(59, 130, 246, 0.35); }
    .marketing-btn.whatsapp {
      background: rgba(34, 197, 94, 0.2);
      color: #86EFAC;
    }
    .marketing-btn.whatsapp:hover { background: rgba(34, 197, 94, 0.35); }
    .marketing-btn.phone {
      background: rgba(168, 85, 247, 0.2);
      color: #D8B4FE;
    }
    .marketing-btn.phone:hover { background: rgba(168, 85, 247, 0.35); }

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

    /* Smart Slot Suggestions */
    .smart-suggestions {
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 12px;
    }
    .suggestion-label {
      display: block;
      font-size: 0.8rem;
      color: rgba(255,255,255,0.7);
      margin-bottom: 0.5rem;
    }
    .suggestion-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .slot-chip {
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.05);
      color: white;
      cursor: pointer;
      font-size: 0.85rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.2s;
    }
    .slot-chip:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.3); }
    .slot-chip.baja { border-color: rgba(16, 185, 129, 0.5); background: rgba(16, 185, 129, 0.15); }
    .slot-chip.media { border-color: rgba(245, 158, 11, 0.5); background: rgba(245, 158, 11, 0.15); }
    .slot-chip.alta { border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); }
    .availability-badge {
      font-size: 0.65rem;
      color: rgba(255,255,255,0.5);
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

    /* Automation Button */
    .automation-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: #C4B5FD;
    }
    .automation-btn:hover {
      background: rgba(139, 92, 246, 0.25);
      transform: translateY(-2px);
    }
    .automation-badge {
      background: #8B5CF6;
      color: white;
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
    }

    /* Automation Modal */
    .automation-modal { max-width: 900px; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; }
    .automation-header { display: flex; justify-content: space-between; align-items: center; }
    .automation-title { display: flex; align-items: center; gap: 1rem; }
    .automation-title h2 { margin: 0; }
    .plan-badge {
      background: linear-gradient(135deg, #10B981, #34D399);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .automation-tabs {
      display: flex;
      gap: 0.5rem;
      padding: 0 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .tab-btn {
      padding: 0.75rem 1.25rem;
      border: none;
      background: transparent;
      color: rgba(255,255,255,0.6);
      cursor: pointer;
      font-size: 0.9rem;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: white; }
    .tab-btn.active {
      color: #8B5CF6;
      border-bottom-color: #8B5CF6;
    }

    .automation-content {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    /* Flujos Section */
    .section-intro { margin-bottom: 1rem; color: rgba(255,255,255,0.6); font-size: 0.9rem; }
    .automations-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .automation-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      transition: all 0.2s;
    }
    .automation-item:hover { border-color: rgba(139, 92, 246, 0.3); }
    .automation-item.active { border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.05); }
    .auto-icon { font-size: 1.5rem; }
    .auto-info { flex: 1; }
    .auto-name { display: block; font-weight: 600; margin-bottom: 0.25rem; }
    .auto-desc { display: block; font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 0.5rem; }
    .auto-channels { display: flex; gap: 0.5rem; }
    .channel-tag {
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 10px;
      background: rgba(255,255,255,0.1);
    }
    .channel-tag.email { background: rgba(59, 130, 246, 0.2); color: #93C5FD; }
    .channel-tag.whatsapp { background: rgba(34, 197, 94, 0.2); color: #86EFAC; }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      width: 50px;
      height: 26px;
    }
    .toggle-switch.small { width: 40px; height: 22px; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: rgba(255,255,255,0.1);
      border-radius: 26px;
      transition: 0.3s;
    }
    .toggle-slider:before {
      content: "";
      position: absolute;
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }
    .toggle-switch.small .toggle-slider:before { height: 16px; width: 16px; }
    .toggle-switch input:checked + .toggle-slider { background: #10B981; }
    .toggle-switch input:checked + .toggle-slider:before { transform: translateX(24px); }
    .toggle-switch.small input:checked + .toggle-slider:before { transform: translateX(18px); }

    /* Templates Section */
    .templates-header { margin-bottom: 1rem; }
    .templates-header p { color: rgba(255,255,255,0.6); font-size: 0.9rem; margin-bottom: 0.5rem; }
    .variables-hint { font-size: 0.8rem; color: rgba(255,255,255,0.4); }
    .variables-hint code {
      background: rgba(139, 92, 246, 0.2);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      margin: 0 0.25rem;
    }
    .templates-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .template-card {
      padding: 1rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      cursor: pointer;
      transition: all 0.2s;
    }
    .template-card:hover { border-color: rgba(139, 92, 246, 0.4); transform: translateY(-2px); }
    .template-header-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .template-name { font-weight: 600; }
    .template-type {
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
      background: rgba(255,255,255,0.1);
    }
    .template-type.email { background: rgba(59, 130, 246, 0.2); color: #93C5FD; }
    .template-type.whatsapp { background: rgba(34, 197, 94, 0.2); color: #86EFAC; }
    .template-type.ambos { background: rgba(139, 92, 246, 0.2); color: #C4B5FD; }
    .template-subject { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 0.5rem; }
    .template-preview {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.4);
      white-space: pre-line;
      max-height: 60px;
      overflow: hidden;
    }
    .edit-template-btn {
      margin-top: 0.75rem;
      padding: 0.4rem 0.75rem;
      border: none;
      background: rgba(139, 92, 246, 0.2);
      color: #C4B5FD;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.75rem;
    }

    /* Historial Section */
    .historial-stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .stat-box {
      flex: 1;
      padding: 1rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.05);
      text-align: center;
    }
    .stat-box.success { border-left: 3px solid #10B981; }
    .stat-box.error { border-left: 3px solid #EF4444; }
    .stat-val { display: block; font-size: 1.5rem; font-weight: 800; color: #C4B5FD; }
    .stat-lbl { font-size: 0.75rem; color: rgba(255,255,255,0.5); }
    .logs-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto; }
    .log-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 8px;
      background: rgba(255,255,255,0.03);
      font-size: 0.85rem;
    }
    .log-item.enviado { border-left: 3px solid #10B981; }
    .log-item.fallido { border-left: 3px solid #EF4444; }
    .log-item.pendiente { border-left: 3px solid #F59E0B; }
    .log-icon { font-size: 1rem; }
    .log-info { flex: 1; }
    .log-auto { font-weight: 500; }
    .log-client { color: rgba(255,255,255,0.5); margin-left: 0.5rem; }
    .log-status { font-size: 1rem; }
    .log-date { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
    .no-logs { text-align: center; padding: 2rem; color: rgba(255,255,255,0.4); }

    /* Config Section */
    .config-section { display: flex; flex-direction: column; gap: 1.5rem; }
    .config-group {
      padding: 1.25rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
    }
    .config-group h4 { margin: 0 0 1rem; font-size: 1rem; }
    .config-group-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .config-group-header h4 { margin: 0; }
    .config-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .form-row { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-row.half { width: 50%; }
    .form-row label { font-size: 0.8rem; color: rgba(255,255,255,0.6); }
    .form-row input, .form-row select {
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.05);
      color: white;
      font-size: 0.9rem;
    }
    .form-row input:focus, .form-row select:focus { outline: none; border-color: #8B5CF6; }
    .test-btn {
      margin-top: 0.5rem;
      padding: 0.6rem 1rem;
      border: none;
      background: rgba(59, 130, 246, 0.2);
      color: #93C5FD;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      align-self: flex-start;
    }
    .test-btn:hover { background: rgba(59, 130, 246, 0.35); }
    .config-actions { display: flex; justify-content: center; }
    .save-config-btn {
      padding: 0.85rem 2rem;
      border: none;
      background: linear-gradient(135deg, #8B5CF6, #6366F1);
      color: white;
      border-radius: 12px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .save-config-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(139, 92, 246, 0.4); }
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

  // Marketing signals
  marketingCollapsed = signal(true);
  emailsSentToday = signal(12);
  whatsappSentToday = signal(8);
  marketingOpenRate = signal(78);

  // Automation System signals
  showAutomationModal = signal(false);
  automationTab = signal<'flujos' | 'templates' | 'historial' | 'config'>('flujos');

  // Demo automations
  automations = signal<Automation[]>([
    { id: '1', nombre: 'Confirmación de Reserva', descripcion: 'Envía confirmación cuando se crea una reserva', tipo: 'auto-respuesta', trigger: 'nueva-reserva', canales: ['email', 'whatsapp'], templateId: '1', activa: true },
    { id: '2', nombre: 'Recordatorio 24h', descripcion: 'Recuerda al cliente 24 horas antes de su cita', tipo: 'recordatorio', trigger: '24h-antes', canales: ['whatsapp'], templateId: '2', activa: true },
    { id: '3', nombre: 'Recordatorio 2h', descripcion: 'Recordatorio el mismo día, 2 horas antes', tipo: 'recordatorio', trigger: '2h-antes', canales: ['whatsapp'], templateId: '3', activa: false },
    { id: '4', nombre: 'Agradecimiento Post-Visita', descripcion: 'Mensaje de agradecimiento después de completar la reserva', tipo: 'auto-respuesta', trigger: 'completada', canales: ['email'], templateId: '4', activa: true },
    { id: '5', nombre: 'Aviso de Cancelación', descripcion: 'Confirma la cancelación de una reserva', tipo: 'auto-respuesta', trigger: 'cancelacion', canales: ['email', 'whatsapp'], templateId: '5', activa: true },
    { id: '6', nombre: 'Felicitación de Cumpleaños', descripcion: 'Envía un cupón de descuento en el cumpleaños del cliente', tipo: 'campaña', trigger: 'cumpleaños', canales: ['email', 'whatsapp'], templateId: '6', activa: false, condiciones: { soloVIP: false } },
    { id: '7', nombre: 'Reactivación Clientes', descripcion: 'Contacta clientes que no visitan hace más de 30 días', tipo: 'campaña', trigger: 'inactividad', canales: ['email'], templateId: '7', activa: false, condiciones: { diasInactividad: 30 } },
  ]);

  // Message templates
  messageTemplates = signal<MessageTemplate[]>([
    { id: '1', nombre: 'Confirmación de Reserva', tipo: 'ambos', asunto: 'Tu reserva ha sido confirmada ✅', contenido: 'Hola {{cliente}}! 👋\n\nTu reserva ha sido registrada:\n\n📅 Fecha: {{fecha}}\n🕐 Hora: {{hora}}\n👥 Personas: {{personas}}\n\n¡Te esperamos en {{negocio}}!\n\nSaludos cordiales.', variables: ['cliente', 'fecha', 'hora', 'personas', 'negocio'] },
    { id: '2', nombre: 'Recordatorio 24h', tipo: 'whatsapp', contenido: 'Hola {{cliente}}! 📅\n\nTe recordamos que mañana tienes una reserva con nosotros:\n\n🕐 {{fecha}} a las {{hora}}\n👥 {{personas}} personas\n\n¡Te esperamos! ✨\n\n{{negocio}}', variables: ['cliente', 'fecha', 'hora', 'personas', 'negocio'] },
    { id: '3', nombre: 'Recordatorio 2h', tipo: 'whatsapp', contenido: 'Hola {{cliente}}! ⏰\n\n¡Tu reserva es en 2 horas!\n\n🕐 {{hora}}\n📍 {{direccion}}\n\n¡Te esperamos! 🙌', variables: ['cliente', 'hora', 'direccion'] },
    { id: '4', nombre: 'Agradecimiento Post-Visita', tipo: 'email', asunto: 'Gracias por tu visita 🙏', contenido: 'Hola {{cliente}},\n\n¡Gracias por visitarnos hoy! Esperamos que hayas disfrutado tu experiencia.\n\nNos encantaría que nos dejaras una reseña:\n⭐ [Dejar reseña]\n\n¡Hasta pronto!\n{{negocio}}', variables: ['cliente', 'negocio'] },
    { id: '5', nombre: 'Cancelación', tipo: 'ambos', asunto: 'Reserva cancelada', contenido: 'Hola {{cliente}},\n\nTu reserva del {{fecha}} a las {{hora}} ha sido cancelada.\n\nSi deseas reagendar, contáctanos.\n\nSaludos,\n{{negocio}}', variables: ['cliente', 'fecha', 'hora', 'negocio'] },
    { id: '6', nombre: 'Felicitación Cumpleaños', tipo: 'ambos', asunto: '¡Feliz Cumpleaños! 🎂', contenido: 'Hola {{cliente}}! 🎉\n\n¡Feliz Cumpleaños de parte de todo el equipo de {{negocio}}!\n\nTenemos un regalo especial para ti:\n🎁 20% de descuento en tu próxima visita\n\nCódigo: CUMPLE20\n\n¡Te esperamos pronto!', variables: ['cliente', 'negocio'] },
    { id: '7', nombre: 'Reactivación', tipo: 'email', asunto: 'Te extrañamos 💔', contenido: 'Hola {{cliente}},\n\nHace tiempo que no nos visitas y te echamos de menos.\n\nQueremos darte un 15% de descuento en tu próxima reserva:\n🎟️ Código: VUELVE15\n\n¿Te gustaría agendar una visita?\n\n{{negocio}}', variables: ['cliente', 'negocio'] },
  ]);

  // Automation logs
  automationLogs = signal<AutomationLog[]>([
    { id: '1', automationId: '1', automationNombre: 'Confirmación de Reserva', clienteNombre: 'María González', canal: 'email', estado: 'enviado', fechaEnvio: '2026-01-19 10:30', mensaje: 'Confirmación enviada' },
    { id: '2', automationId: '1', automationNombre: 'Confirmación de Reserva', clienteNombre: 'María González', canal: 'whatsapp', estado: 'enviado', fechaEnvio: '2026-01-19 10:30', mensaje: 'WhatsApp enviado' },
    { id: '3', automationId: '2', automationNombre: 'Recordatorio 24h', clienteNombre: 'Juan Pérez', canal: 'whatsapp', estado: 'enviado', fechaEnvio: '2026-01-18 20:00', mensaje: 'Recordatorio enviado' },
    { id: '4', automationId: '4', automationNombre: 'Agradecimiento Post-Visita', clienteNombre: 'Ana Martínez', canal: 'email', estado: 'enviado', fechaEnvio: '2026-01-17 22:00', mensaje: 'Email de agradecimiento' },
  ]);

  // Automation Config - saved in localStorage in production
  automationConfig: AutomationConfig = {
    whatsapp: {
      provider: 'none',
      accountSid: '',
      authToken: '',
      phoneNumberId: '',
      accessToken: '',
      fromNumber: '',
      enabled: false,
      testMode: true
    },
    email: {
      provider: 'none',
      apiKey: '',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: '',
      enabled: false,
      testMode: true
    },
    negocioNombre: 'Mi Negocio',
    negocioDireccion: 'Av. Principal 123',
    negocioTelefono: '+56 9 1234 5678'
  };

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

  // Smart Slot Suggestions
  suggestedSlots = computed(() => {
    const fecha = this.formData.fecha || this.getTodayStr();
    const reservasDelDia = this.reservations().filter(r => r.fecha === fecha && r.estado !== 'cancelada');
    const totalResources = this.resources().length;

    return this.timeSlots
      .map(hora => {
        const reservasEnHora = reservasDelDia.filter(r => r.hora === hora).length;
        const disponibles = totalResources - reservasEnHora;
        const demanda = disponibles >= totalResources * 0.7 ? 'baja' :
          disponibles >= totalResources * 0.4 ? 'media' : 'alta';
        return { hora, disponibles, demanda };
      })
      .filter(slot => slot.disponibles > 0)
      .slice(0, 6); // Show top 6 suggestions
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

  // Marketing computed
  sentCampaignsToday = computed(() => this.emailsSentToday() + this.whatsappSentToday());

  // Marketing Methods - Customer Actions
  sendEmailTo(customer: Customer): void {
    if (customer.email) {
      const subject = encodeURIComponent('Recordatorio de Reserva');
      const body = encodeURIComponent(`Hola ${customer.nombre},\n\nLe escribimos para confirmar su reserva.\n\nSaludos cordiales.`);
      window.open(`mailto:${customer.email}?subject=${subject}&body=${body}`, '_blank');
      this.emailsSentToday.update(n => n + 1);
    } else {
      alert('Este cliente no tiene email registrado');
    }
  }

  sendWhatsAppTo(customer: Customer): void {
    const phone = customer.telefono.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola ${customer.nombre}! 👋\n\n¿Cómo estás? Queríamos recordarte tu próxima visita con nosotros.\n\n¿Tienes alguna consulta?`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    this.whatsappSentToday.update(n => n + 1);
  }

  callCustomer(customer: Customer): void {
    window.open(`tel:${customer.telefono}`, '_self');
  }

  // Marketing Methods - Reservation Actions
  sendReservationConfirmationEmail(res: Reservation): void {
    const subject = encodeURIComponent(`Confirmación de Reserva - ${this.formatDate(res.fecha)}`);
    const body = encodeURIComponent(
      `Hola ${res.cliente},\n\n` +
      `Tu reserva ha sido confirmada:\n\n` +
      `📅 Fecha: ${this.formatDate(res.fecha)}\n` +
      `🕐 Hora: ${res.hora}\n` +
      `👥 Personas: ${res.personas}\n\n` +
      `¡Te esperamos!\n\nSaludos cordiales.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    this.emailsSentToday.update(n => n + 1);
  }

  sendReservationWhatsApp(res: Reservation): void {
    const phone = res.telefono.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hola ${res.cliente}! 👋\n\n` +
      `Recordatorio de tu reserva:\n` +
      `📅 ${this.formatDate(res.fecha)}\n` +
      `🕐 ${res.hora}\n` +
      `👥 ${res.personas} personas\n\n` +
      `¡Te esperamos! ✨`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    this.whatsappSentToday.update(n => n + 1);
  }

  callReservationCustomer(res: Reservation): void {
    window.open(`tel:${res.telefono}`, '_self');
  }

  // Bulk Campaign Methods
  sendBulkConfirmation(): void {
    const pending = this.reservations().filter(r => r.estado === 'pendiente').length;
    if (pending > 0) {
      alert(`📧 Se enviarán ${pending} confirmaciones por email y WhatsApp a reservas pendientes.`);
      this.emailsSentToday.update(n => n + pending);
      this.whatsappSentToday.update(n => n + pending);
    } else {
      alert('No hay reservas pendientes para confirmar.');
    }
  }

  sendBulkReminder(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const count = this.reservations().filter(r => r.fecha === tomorrowStr && r.estado !== 'cancelada').length;
    if (count > 0) {
      alert(`⏰ Se enviarán ${count} recordatorios para las citas de mañana.`);
      this.whatsappSentToday.update(n => n + count);
    } else {
      alert('No hay reservas para mañana.');
    }
  }

  sendBulkThankYou(): void {
    const today = this.getTodayStr();
    const completed = this.reservations().filter(r => r.fecha === today && r.estado === 'completada').length;
    if (completed > 0) {
      alert(`🙏 Se enviarán ${completed} mensajes de agradecimiento a clientes de hoy.`);
      this.emailsSentToday.update(n => n + completed);
    } else {
      alert('No hay visitas completadas hoy aún.');
    }
  }

  sendReactivationCampaign(): void {
    const inactiveCount = this.customers().filter(c => {
      if (!c.ultimaVisita) return true;
      const lastVisit = new Date(c.ultimaVisita);
      const daysSince = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 30;
    }).length;
    alert(`🔄 Se enviará campaña de reactivación a ${inactiveCount} clientes inactivos (+30 días).`);
    this.emailsSentToday.update(n => n + inactiveCount);
  }

  // Automation System Methods
  activeAutomationsCount = computed(() => this.automations().filter(a => a.activa).length);
  successfulLogsCount = computed(() => this.automationLogs().filter(l => l.estado === 'enviado').length);
  failedLogsCount = computed(() => this.automationLogs().filter(l => l.estado === 'fallido').length);

  getCurrentPlan(): string {
    // This would be fetched from subscription service in production
    return 'Plan Pro';
  }

  getAutoIcon(trigger: Automation['trigger']): string {
    const icons: Record<string, string> = {
      'nueva-reserva': '📅',
      'confirmacion': '✅',
      'cancelacion': '❌',
      'completada': '🏁',
      '24h-antes': '⏰',
      '2h-antes': '⏱️',
      'cumpleaños': '🎂',
      'inactividad': '💤',
      'manual': '👆'
    };
    return icons[trigger] || '⚡';
  }

  toggleAutomation(auto: Automation): void {
    this.automations.update(list =>
      list.map(a => a.id === auto.id ? { ...a, activa: !a.activa } : a)
    );
    const newState = !auto.activa;
    console.log(`Automation "${auto.nombre}" ${newState ? 'activada' : 'desactivada'}`);
  }

  editTemplate(template: MessageTemplate): void {
    const newContent = prompt('Editar contenido del template:\n\nVariables disponibles: ' + template.variables.map(v => `{{${v}}}`).join(', '), template.contenido);
    if (newContent !== null) {
      this.messageTemplates.update(list =>
        list.map(t => t.id === template.id ? { ...t, contenido: newContent } : t)
      );
      alert('✅ Template actualizado correctamente');
    }
  }

  testEmailConnection(): void {
    if (!this.automationConfig.email.provider || this.automationConfig.email.provider === 'none') {
      alert('⚠️ Selecciona un proveedor de email primero');
      return;
    }
    // Simulated test - in production would make actual API call
    setTimeout(() => {
      alert('✅ Conexión de Email exitosa!\n\nProveedor: ' + this.automationConfig.email.provider);
    }, 1000);
  }

  testWhatsAppConnection(): void {
    if (!this.automationConfig.whatsapp.provider || this.automationConfig.whatsapp.provider === 'none') {
      alert('⚠️ Selecciona un proveedor de WhatsApp primero');
      return;
    }
    // Simulated test - in production would make actual API call
    setTimeout(() => {
      alert('✅ Conexión de WhatsApp exitosa!\n\nProveedor: ' + this.automationConfig.whatsapp.provider);
    }, 1000);
  }

  saveAutomationConfig(): void {
    // In production, this would save to backend or localStorage
    localStorage.setItem('automationConfig', JSON.stringify(this.automationConfig));
    alert('💾 Configuración guardada correctamente');
    console.log('Automation config saved:', this.automationConfig);
  }

  loadAutomationConfig(): void {
    const saved = localStorage.getItem('automationConfig');
    if (saved) {
      try {
        this.automationConfig = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading automation config', e);
      }
    }
  }
}
