import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

interface Reservation {
    id: string;
    cliente: string;
    telefono: string;
    email?: string;
    fecha: string;
    hora: string;
    duracion: number; // minutes
    personas: number;
    mesa?: string;
    estado: 'confirmada' | 'pendiente' | 'cancelada' | 'completada' | 'no_show';
    notas?: string;
    createdAt: Date;
}

interface Table {
    id: string;
    numero: string;
    capacidad: number;
    ubicacion: 'interior' | 'terraza' | 'privado';
    estado: 'disponible' | 'ocupada' | 'reservada' | 'mantenimiento';
}

@Component({
    selector: 'app-reservations',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="reservations-container">
      <!-- Header -->
      <header class="res-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-btn">←</a>
          <div class="title-section">
            <h1>📅 Reservas</h1>
            <p class="subtitle">Gestiona reservas de mesas y citas</p>
          </div>
        </div>
        <div class="header-actions">
          <div class="date-nav">
            <button class="nav-btn" (click)="prevDay()">←</button>
            <span class="current-date">{{ formatSelectedDate() }}</span>
            <button class="nav-btn" (click)="nextDay()">→</button>
          </div>
          <button class="action-btn primary" (click)="showNewReservation = true">
            ➕ Nueva Reserva
          </button>
        </div>
      </header>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card gradient-purple">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <span class="stat-value">{{ reservasHoy() }}</span>
            <span class="stat-label">Reservas Hoy</span>
          </div>
        </div>
        <div class="stat-card gradient-green">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <span class="stat-value">{{ confirmadas() }}</span>
            <span class="stat-label">Confirmadas</span>
          </div>
        </div>
        <div class="stat-card gradient-amber">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <span class="stat-value">{{ pendientes() }}</span>
            <span class="stat-label">Pendientes</span>
          </div>
        </div>
        <div class="stat-card gradient-blue">
          <div class="stat-icon">🪑</div>
          <div class="stat-content">
            <span class="stat-value">{{ mesasDisponibles() }}/{{ tables().length }}</span>
            <span class="stat-label">Mesas Disponibles</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active]="activeTab === 'timeline'" (click)="activeTab = 'timeline'">
          🕐 Línea de Tiempo
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'list'" (click)="activeTab = 'list'">
          📋 Lista
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'tables'" (click)="activeTab = 'tables'">
          🪑 Mesas
        </button>
      </div>

      <!-- Timeline View -->
      @if (activeTab === 'timeline') {
        <div class="timeline-view">
          <div class="time-slots">
            @for (slot of timeSlots; track slot) {
              <div class="time-slot">
                <span class="time-label">{{ slot }}</span>
                <div class="slot-reservations">
                  @for (res of getReservationsForTime(slot); track res.id) {
                    <div class="res-block" [class]="res.estado" [style.width.%]="getBlockWidth(res)">
                      <span class="res-time">{{ res.hora }}</span>
                      <span class="res-name">{{ res.cliente }}</span>
                      <span class="res-people">👥 {{ res.personas }}</span>
                      @if (res.mesa) {
                        <span class="res-table">Mesa {{ res.mesa }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- List View -->
      @if (activeTab === 'list') {
        <div class="list-view">
          @for (res of filteredReservations(); track res.id) {
            <div class="reservation-card" [class]="res.estado">
              <div class="res-time-badge">
                {{ res.hora }}
              </div>
              <div class="res-info">
                <h3>{{ res.cliente }}</h3>
                <div class="res-details">
                  <span>👥 {{ res.personas }} personas</span>
                  <span>📞 {{ res.telefono }}</span>
                  @if (res.mesa) {
                    <span>🪑 Mesa {{ res.mesa }}</span>
                  }
                </div>
                @if (res.notas) {
                  <p class="res-notes">📝 {{ res.notas }}</p>
                }
              </div>
              <div class="res-status">
                <span class="status-badge" [class]="res.estado">
                  {{ getStatusIcon(res.estado) }} {{ getStatusLabel(res.estado) }}
                </span>
              </div>
              <div class="res-actions">
                @if (res.estado === 'pendiente') {
                  <button class="action-sm confirm" (click)="confirmReservation(res)">✅</button>
                }
                @if (res.estado === 'confirmada') {
                  <button class="action-sm complete" (click)="completeReservation(res)">🏁</button>
                }
                <button class="action-sm edit" (click)="editReservation(res)">✏️</button>
                <button class="action-sm cancel" (click)="cancelReservation(res)">❌</button>
              </div>
            </div>
          }

          @if (filteredReservations().length === 0) {
            <div class="empty-state">
              <span class="emoji">📅</span>
              <h2>Sin reservas</h2>
              <p>No hay reservas para esta fecha</p>
            </div>
          }
        </div>
      }

      <!-- Tables View -->
      @if (activeTab === 'tables') {
        <div class="tables-view">
          <div class="tables-grid">
            @for (table of tables(); track table.id) {
              <div class="table-card" [class]="table.estado">
                <div class="table-number">{{ table.numero }}</div>
                <div class="table-info">
                  <span class="capacity">👥 {{ table.capacidad }}</span>
                  <span class="location">{{ getLocationLabel(table.ubicacion) }}</span>
                </div>
                <div class="table-status">
                  {{ getTableStatusLabel(table.estado) }}
                </div>
                <div class="table-actions">
                  @if (table.estado === 'disponible') {
                    <button class="table-btn reserve" (click)="reserveTable(table)">Reservar</button>
                  }
                  @if (table.estado === 'reservada') {
                    <button class="table-btn occupy" (click)="occupyTable(table)">Ocupar</button>
                  }
                  @if (table.estado === 'ocupada') {
                    <button class="table-btn free" (click)="freeTable(table)">Liberar</button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- New Reservation Modal -->
      @if (showNewReservation) {
        <div class="modal-overlay" (click)="showNewReservation = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>📅 Nueva Reserva</h2>
            <form (ngSubmit)="createReservation()">
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre del Cliente</label>
                  <input type="text" [(ngModel)]="newRes.cliente" name="cliente" required>
                </div>
                <div class="form-group">
                  <label>Teléfono</label>
                  <input type="tel" [(ngModel)]="newRes.telefono" name="telefono" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Fecha</label>
                  <input type="date" [(ngModel)]="newRes.fecha" name="fecha" required>
                </div>
                <div class="form-group">
                  <label>Hora</label>
                  <input type="time" [(ngModel)]="newRes.hora" name="hora" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Personas</label>
                  <select [(ngModel)]="newRes.personas" name="personas">
                    @for (n of [1,2,3,4,5,6,7,8,10,12]; track n) {
                      <option [value]="n">{{ n }} personas</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Mesa (opcional)</label>
                  <select [(ngModel)]="newRes.mesa" name="mesa">
                    <option value="">Asignar después</option>
                    @for (table of availableTables(); track table.id) {
                      <option [value]="table.numero">Mesa {{ table.numero }} ({{ table.capacidad }}p)</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Notas</label>
                <textarea [(ngModel)]="newRes.notas" name="notas" rows="2" placeholder="Preferencias, alergias, celebración..."></textarea>
              </div>
              <div class="modal-actions">
                <button type="button" class="cancel-btn" (click)="showNewReservation = false">Cancelar</button>
                <button type="submit" class="save-btn">Crear Reserva</button>
              </div>
            </form>
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
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left { display: flex; align-items: center; gap: 1rem; }

    .back-btn {
      width: 48px; height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none; color: white; font-size: 1.5rem;
    }

    .title-section h1 { margin: 0; font-size: 1.75rem; }
    .subtitle { color: rgba(255, 255, 255, 0.6); margin: 0.25rem 0 0; }

    .header-actions { display: flex; gap: 1rem; align-items: center; }

    .date-nav {
      display: flex; align-items: center; gap: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.5rem; border-radius: 10px;
    }

    .nav-btn {
      width: 36px; height: 36px;
      border-radius: 8px; border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white; cursor: pointer;
    }

    .current-date { padding: 0 1rem; font-weight: 600; }

    .action-btn {
      padding: 0.75rem 1.5rem; border-radius: 12px;
      border: none; font-weight: 600; cursor: pointer;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      padding: 1.5rem; border-radius: 16px;
      display: flex; align-items: center; gap: 1rem;
    }

    .gradient-purple { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
    .gradient-green { background: linear-gradient(135deg, #10B981, #34D399); }
    .gradient-amber { background: linear-gradient(135deg, #F59E0B, #FBBF24); }
    .gradient-blue { background: linear-gradient(135deg, #3B82F6, #0EA5E9); }

    .stat-icon { font-size: 2.5rem; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.75rem; font-weight: 800; }
    .stat-label { font-size: 0.875rem; opacity: 0.9; }

    /* Tabs */
    .tabs-container {
      display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.5rem; border-radius: 12px;
    }

    .tab-btn {
      padding: 0.75rem 1.5rem;
      border: none; background: transparent;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 600; cursor: pointer; border-radius: 8px;
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white;
    }

    /* Timeline */
    .timeline-view { overflow-x: auto; }

    .time-slots { display: flex; flex-direction: column; gap: 0.5rem; }

    .time-slot {
      display: flex; gap: 1rem; padding: 0.5rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .time-label {
      width: 60px; font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
    }

    .slot-reservations {
      flex: 1; display: flex; flex-wrap: wrap; gap: 0.5rem;
    }

    .res-block {
      padding: 0.75rem 1rem;
      border-radius: 10px;
      background: rgba(99, 102, 241, 0.2);
      border-left: 4px solid #6366F1;
      display: flex; gap: 1rem; align-items: center;
      font-size: 0.875rem;
    }

    .res-block.confirmada { background: rgba(16, 185, 129, 0.2); border-color: #10B981; }
    .res-block.pendiente { background: rgba(245, 158, 11, 0.2); border-color: #F59E0B; }
    .res-block.completada { background: rgba(99, 102, 241, 0.1); border-color: #6366F1; opacity: 0.6; }

    .res-time { font-weight: 700; }
    .res-name { font-weight: 500; }
    .res-people, .res-table { color: rgba(255, 255, 255, 0.6); }

    /* List View */
    .list-view { display: flex; flex-direction: column; gap: 1rem; }

    .reservation-card {
      display: flex; gap: 1.5rem; align-items: center;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      border-left: 4px solid #6366F1;
    }

    .reservation-card.confirmada { border-color: #10B981; }
    .reservation-card.pendiente { border-color: #F59E0B; }
    .reservation-card.cancelada { border-color: #EF4444; opacity: 0.5; }

    .res-time-badge {
      min-width: 70px;
      padding: 0.75rem;
      background: rgba(99, 102, 241, 0.2);
      border-radius: 10px;
      text-align: center;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .res-info { flex: 1; }
    .res-info h3 { margin: 0 0 0.5rem; }
    .res-details { display: flex; gap: 1.5rem; flex-wrap: wrap; color: rgba(255, 255, 255, 0.7); font-size: 0.875rem; }
    .res-notes { margin: 0.5rem 0 0; font-size: 0.875rem; color: rgba(255, 255, 255, 0.5); }

    .status-badge {
      padding: 0.5rem 1rem; border-radius: 20px;
      font-size: 0.75rem; font-weight: 600;
    }

    .status-badge.confirmada { background: rgba(16, 185, 129, 0.2); color: #10B981; }
    .status-badge.pendiente { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
    .status-badge.completada { background: rgba(99, 102, 241, 0.2); color: #8B5CF6; }
    .status-badge.cancelada { background: rgba(239, 68, 68, 0.2); color: #EF4444; }

    .res-actions { display: flex; gap: 0.5rem; }

    .action-sm {
      width: 36px; height: 36px;
      border-radius: 8px; border: none;
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer; font-size: 1rem;
    }

    .action-sm:hover { background: rgba(255, 255, 255, 0.2); }
    .action-sm.confirm:hover { background: rgba(16, 185, 129, 0.3); }
    .action-sm.cancel:hover { background: rgba(239, 68, 68, 0.3); }

    /* Tables View */
    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1.25rem;
    }

    .table-card {
      padding: 1.5rem;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.05);
      text-align: center;
      border: 2px solid transparent;
    }

    .table-card.disponible { border-color: #10B981; }
    .table-card.reservada { border-color: #F59E0B; }
    .table-card.ocupada { border-color: #6366F1; background: rgba(99, 102, 241, 0.1); }
    .table-card.mantenimiento { border-color: #EF4444; opacity: 0.5; }

    .table-number {
      font-size: 2rem; font-weight: 800;
      margin-bottom: 0.5rem;
    }

    .table-info { display: flex; justify-content: center; gap: 1rem; margin-bottom: 0.75rem; }
    .table-info span { color: rgba(255, 255, 255, 0.6); font-size: 0.875rem; }

    .table-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      display: inline-block;
      margin-bottom: 1rem;
    }

    .table-actions { display: flex; justify-content: center; }

    .table-btn {
      padding: 0.5rem 1rem;
      border-radius: 8px; border: none;
      font-weight: 500; cursor: pointer;
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .table-btn.reserve { background: linear-gradient(135deg, #10B981, #34D399); }
    .table-btn.occupy { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
    .table-btn.free { background: linear-gradient(135deg, #F59E0B, #D97706); }

    /* Empty State */
    .empty-state {
      text-align: center; padding: 4rem 2rem;
    }

    .empty-state .emoji { font-size: 4rem; }
    .empty-state h2 { margin: 1rem 0 0.5rem; }
    .empty-state p { color: rgba(255, 255, 255, 0.5); }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 20px; padding: 2rem;
      width: 90%; max-width: 550px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .modal-content h2 { margin: 0 0 1.5rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; padding: 0.75rem 1rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05);
      color: white; font-size: 1rem;
    }

    .modal-actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .cancel-btn, .save-btn {
      flex: 1; padding: 0.75rem;
      border-radius: 10px; border: none;
      cursor: pointer; font-weight: 600;
    }

    .cancel-btn { background: rgba(255, 255, 255, 0.1); color: white; }
    .save-btn { background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; }

    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; }
      .reservation-card { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class ReservationsComponent implements OnInit {
    private authService = inject(AuthService);

    activeTab: 'timeline' | 'list' | 'tables' = 'list';
    selectedDate = signal(new Date());
    showNewReservation = false;

    timeSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

    newRes = {
        cliente: '',
        telefono: '',
        fecha: new Date().toISOString().split('T')[0],
        hora: '19:00',
        personas: 2,
        mesa: '',
        notas: ''
    };

    // Demo reservations
    reservations = signal<Reservation[]>([
        { id: '1', cliente: 'María González', telefono: '+56912345678', fecha: new Date().toISOString().split('T')[0], hora: '13:00', duracion: 90, personas: 4, mesa: '5', estado: 'confirmada', createdAt: new Date() },
        { id: '2', cliente: 'Juan Pérez', telefono: '+56987654321', fecha: new Date().toISOString().split('T')[0], hora: '14:30', duracion: 60, personas: 2, mesa: '3', estado: 'confirmada', notas: 'Aniversario - traer postre especial', createdAt: new Date() },
        { id: '3', cliente: 'Ana Martínez', telefono: '+56911223344', fecha: new Date().toISOString().split('T')[0], hora: '19:00', duracion: 120, personas: 8, mesa: '10', estado: 'pendiente', notas: 'Cumpleaños', createdAt: new Date() },
        { id: '4', cliente: 'Carlos López', telefono: '+56955667788', fecha: new Date().toISOString().split('T')[0], hora: '20:00', duracion: 90, personas: 6, estado: 'pendiente', createdAt: new Date() },
        { id: '5', cliente: 'Patricia Díaz', telefono: '+56944556677', fecha: new Date().toISOString().split('T')[0], hora: '21:00', duracion: 90, personas: 4, mesa: '7', estado: 'confirmada', createdAt: new Date() },
    ]);

    // Demo tables
    tables = signal<Table[]>([
        { id: '1', numero: '1', capacidad: 2, ubicacion: 'interior', estado: 'disponible' },
        { id: '2', numero: '2', capacidad: 2, ubicacion: 'interior', estado: 'disponible' },
        { id: '3', numero: '3', capacidad: 2, ubicacion: 'interior', estado: 'reservada' },
        { id: '4', numero: '4', capacidad: 4, ubicacion: 'interior', estado: 'ocupada' },
        { id: '5', numero: '5', capacidad: 4, ubicacion: 'interior', estado: 'reservada' },
        { id: '6', numero: '6', capacidad: 4, ubicacion: 'terraza', estado: 'disponible' },
        { id: '7', numero: '7', capacidad: 4, ubicacion: 'terraza', estado: 'reservada' },
        { id: '8', numero: '8', capacidad: 6, ubicacion: 'terraza', estado: 'disponible' },
        { id: '9', numero: '9', capacidad: 6, ubicacion: 'privado', estado: 'disponible' },
        { id: '10', numero: '10', capacidad: 10, ubicacion: 'privado', estado: 'reservada' },
    ]);

    // Computed
    reservasHoy = computed(() => this.filteredReservations().length);
    confirmadas = computed(() => this.filteredReservations().filter(r => r.estado === 'confirmada').length);
    pendientes = computed(() => this.filteredReservations().filter(r => r.estado === 'pendiente').length);
    mesasDisponibles = computed(() => this.tables().filter(t => t.estado === 'disponible').length);
    availableTables = computed(() => this.tables().filter(t => t.estado === 'disponible'));

    filteredReservations = computed(() => {
        const dateStr = this.selectedDate().toISOString().split('T')[0];
        return this.reservations().filter(r => r.fecha === dateStr);
    });

    ngOnInit() { }

    formatSelectedDate(): string {
        return this.selectedDate().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    prevDay() {
        const d = new Date(this.selectedDate());
        d.setDate(d.getDate() - 1);
        this.selectedDate.set(d);
    }

    nextDay() {
        const d = new Date(this.selectedDate());
        d.setDate(d.getDate() + 1);
        this.selectedDate.set(d);
    }

    getReservationsForTime(slot: string): Reservation[] {
        const hour = parseInt(slot.split(':')[0]);
        return this.filteredReservations().filter(r => {
            const resHour = parseInt(r.hora.split(':')[0]);
            return resHour === hour;
        });
    }

    getBlockWidth(res: Reservation): number {
        return Math.min(100, (res.duracion / 60) * 50);
    }

    getStatusIcon(estado: string): string {
        switch (estado) {
            case 'confirmada': return '✅';
            case 'pendiente': return '⏳';
            case 'cancelada': return '❌';
            case 'completada': return '🏁';
            case 'no_show': return '👻';
            default: return '';
        }
    }

    getStatusLabel(estado: string): string {
        switch (estado) {
            case 'confirmada': return 'Confirmada';
            case 'pendiente': return 'Pendiente';
            case 'cancelada': return 'Cancelada';
            case 'completada': return 'Completada';
            case 'no_show': return 'No se presentó';
            default: return estado;
        }
    }

    getLocationLabel(ubicacion: string): string {
        switch (ubicacion) {
            case 'interior': return '🏠 Interior';
            case 'terraza': return '☀️ Terraza';
            case 'privado': return '🚪 Privado';
            default: return ubicacion;
        }
    }

    getTableStatusLabel(estado: string): string {
        switch (estado) {
            case 'disponible': return '🟢 Disponible';
            case 'reservada': return '🟡 Reservada';
            case 'ocupada': return '🔵 Ocupada';
            case 'mantenimiento': return '🔴 Mantenimiento';
            default: return estado;
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

    editReservation(res: Reservation) {
        alert('Editar: ' + res.cliente);
    }

    reserveTable(table: Table) {
        this.tables.update(list => list.map(t => t.id === table.id ? { ...t, estado: 'reservada' as const } : t));
    }

    occupyTable(table: Table) {
        this.tables.update(list => list.map(t => t.id === table.id ? { ...t, estado: 'ocupada' as const } : t));
    }

    freeTable(table: Table) {
        this.tables.update(list => list.map(t => t.id === table.id ? { ...t, estado: 'disponible' as const } : t));
    }

    createReservation() {
        if (!this.newRes.cliente || !this.newRes.telefono) return;

        const res: Reservation = {
            id: crypto.randomUUID(),
            cliente: this.newRes.cliente,
            telefono: this.newRes.telefono,
            fecha: this.newRes.fecha,
            hora: this.newRes.hora,
            duracion: 90,
            personas: this.newRes.personas,
            mesa: this.newRes.mesa || undefined,
            estado: 'pendiente',
            notas: this.newRes.notas || undefined,
            createdAt: new Date()
        };

        this.reservations.update(list => [res, ...list]);
        this.showNewReservation = false;
        this.newRes = { cliente: '', telefono: '', fecha: new Date().toISOString().split('T')[0], hora: '19:00', personas: 2, mesa: '', notas: '' };
    }
}
