import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { AttendanceService, AttendanceRecord } from '@app/core/services/attendance.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface DaySummary {
  date: Date;
  day: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  attendanceCount: number;
  lateCount: number;
  records: AttendanceRecord[];
}

@Component({
  selector: 'app-attendance-admin',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    TooltipModule,
    DialogModule,
    TableModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="calendar-container fade-in">
      <div class="page-header">
        <div class="header-content">
          <h1>📅 Calendario de Asistencia</h1>
          <p class="subtitle">Monitoreo de turnos y cumplimiento</p>
        </div>
        <div class="header-actions">
           <div class="month-selector">
            <button pButton icon="pi pi-chevron-left" class="p-button-text p-button-rounded" (click)="changeMonth(-1)"></button>
            <span class="current-month">{{ currentMonth() | date:'MMMM yyyy' : '' : 'es-CL' | titlecase }}</span>
            <button pButton icon="pi pi-chevron-right" class="p-button-text p-button-rounded" (click)="changeMonth(1)"></button>
          </div>
          <button pButton label="Reporte Mensual" icon="pi pi-file-excel" class="p-button-outlined p-button-success"></button>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card glass-card">
           <div class="stat-icon" style="background: linear-gradient(135deg, #3B82F6, #60A5FA);">
            <i class="pi pi-clock"></i>
           </div>
           <div class="stat-info">
             <span class="stat-value">{{ totalAttendance() }}</span>
             <span class="stat-label">Marcajes Mes</span>
           </div>
        </div>
        <div class="stat-card glass-card">
           <div class="stat-icon" style="background: linear-gradient(135deg, #F59E0B, #FBBF24);">
            <i class="pi pi-exclamation-triangle"></i>
           </div>
           <div class="stat-info">
             <span class="stat-value">{{ totalLate() }}</span>
             <span class="stat-label">Atrasos</span>
           </div>
        </div>
      </div>

      <!-- Custom Calendar Grid -->
      <div class="calendar-wrapper glass-card">
        <div class="calendar-grid">
          <!-- Weekday Headers -->
          <div class="weekday-header" *ngFor="let day of weekDays">{{ day }}</div>
          
          <!-- Days -->
          <div class="calendar-day" 
               *ngFor="let day of calendarDays()" 
               [class.other-month]="!day.isCurrentMonth"
               [class.today]="day.isToday"
               [class.has-events]="day.attendanceCount > 0"
               (click)="openDayDetails(day)">
               
            <span class="day-number">{{ day.day }}</span>
            
            <div class="day-events" *ngIf="day.attendanceCount > 0">
              <div class="event-dot-group">
                <div class="status-indicator success" *ngIf="day.attendanceCount > day.lateCount" 
                     [pTooltip]="(day.attendanceCount - day.lateCount) + ' Puntuales'"></div>
                <div class="status-indicator warning" *ngIf="day.lateCount > 0"
                     [pTooltip]="day.lateCount + ' Atrasos'"></div>
              </div>
              <span class="count-label">{{ day.attendanceCount }} registros</span>
            </div>
            
            <div class="add-btn-overlay">
                <i class="pi pi-eye"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Day Details Modal -->
      <p-dialog [(visible)]="showDetails" [header]="'Asistencia: ' + (selectedDay()?.date | date:'fullDate' : '' : 'es-CL')" 
                [modal]="true" [style]="{width: '650px'}" styleClass="glass-dialog" [draggable]="false" [resizable]="false">
        
        <div class="dialog-content">
            <p-table [value]="selectedDay()?.records || []" styleClass="p-datatable-sm" [rowHover]="true">
              <ng-template pTemplate="header">
                <tr>
                  <th>Empleado</th>
                  <th>Hora Entrada</th>
                  <th>Hora Salida</th>
                  <th>Estado</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-record>
                <tr>
                  <td>
                    <div class="flex align-items-center gap-2">
                        <div class="avatar-ph">{{ getInitials(record.employeeName) }}</div>
                        <span class="font-medium">{{ record.employeeName || 'Empleado' }}</span>
                    </div>
                  </td>
                  <td class="font-mono text-primary">{{ record.clockInTime | date:'HH:mm' }}</td>
                  <td class="font-mono">{{ record.clockOutTime ? (record.clockOutTime | date:'HH:mm') : '--:--' }}</td>
                  <td>
                    <p-tag [value]="getStatusLabel(record.status)" [severity]="getSeverity(record.status)"></p-tag>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="4" class="text-center p-4 text-gray-400">
                    <i class="pi pi-info-circle mr-2"></i>No hay registros para este día.
                  </td>
                </tr>
              </ng-template>
            </p-table>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .calendar-container {
      padding: 2rem;
      background: radial-gradient(circle at top right, rgba(16, 185, 129, 0.1), transparent 40%),
                  radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.1), transparent 40%);
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 1.5rem;
    }

    .header-content h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -1px;
      background: linear-gradient(135deg, #fff 30%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .subtitle {
      color: #94A3B8;
      margin: 0.5rem 0 0;
      font-size: 1.1rem;
    }
    
    .header-actions {
        display: flex;
        gap: 1.5rem;
        align-items: center;
    }

    .month-selector {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.5rem 1rem;
      border-radius: 50px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      
      .current-month {
        font-size: 1.1rem;
        font-weight: 600;
        min-width: 140px;
        text-align: center;
        color: white;
      }
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 1.5rem;
    }
    
    .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        i { font-size: 1.5rem; color: white; }
    }
    
    .stat-value {
        display: block;
        font-size: 2rem;
        font-weight: 800;
        color: white;
        line-height: 1;
        margin-bottom: 0.25rem;
    }
    
    .stat-label {
        color: #94A3B8;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
    }

    .calendar-wrapper {
        padding: 1.5rem;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .weekday-header {
      padding: 1.25rem;
      text-align: center;
      background: rgba(15, 23, 42, 0.6);
      font-weight: 600;
      color: #94A3B8;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 1px;
    }

    .calendar-day {
      background: rgba(30, 41, 59, 0.4); 
      min-height: 140px;
      padding: 1rem;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      
      &:hover {
        background: rgba(51, 65, 85, 0.6);
        .add-btn-overlay { opacity: 1; }
      }
      
      &.other-month {
        background: rgba(15, 23, 42, 0.4);
        opacity: 0.4;
        pointer-events: none;
      }
      
      &.today {
        background: rgba(99, 102, 241, 0.1);
        box-shadow: inset 0 0 0 2px #6366F1;
        
        .day-number { 
            color: #818CF8; 
            font-weight: 800;
        }
      }
      
      &.has-events {
        background: rgba(30, 41, 59, 0.7);
      }

      .day-number {
        font-weight: 600;
        font-size: 1.2rem;
        color: #CBD5E1;
        margin-bottom: auto;
      }
    }

    .day-events {
      margin-top: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .event-dot-group {
        display: flex;
        gap: 6px;
    }
    
    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        
        &.success { background: #34D399; box-shadow: 0 0 8px rgba(52, 211, 153, 0.5); }
        &.warning { background: #FBBF24; box-shadow: 0 0 8px rgba(251, 191, 36, 0.5); }
    }
    
    .count-label {
        font-size: 0.75rem;
        color: #94A3B8;
    }
    
    .add-btn-overlay {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(99, 102, 241, 0.9);
        width: 40px; height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        opacity: 0;
        transition: opacity 0.2s;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }
    
    .glass-card {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      backdrop-filter: blur(12px);
    }

    .avatar-ph {
        width: 32px; height: 32px;
        background: #475569;
        border-radius: 50%;
        display: flex; 
        align-items: center; 
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 600;
        color: #e2e8f0;
    }
    
    .text-primary { color: #818CF8; }
  `]
})
export class AttendanceAdminComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private messageService = inject(MessageService);

  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  currentMonth = signal(new Date());
  calendarDays = signal<DaySummary[]>([]);

  totalAttendance = signal(0);
  totalLate = signal(0);

  showDetails = false;
  selectedDay = signal<DaySummary | null>(null);

  ngOnInit() {
    this.generateCalendar();
    this.fetchData();
  }

  changeMonth(delta: number) {
    const newDate = new Date(this.currentMonth());
    newDate.setMonth(newDate.getMonth() + delta);
    this.currentMonth.set(newDate);
    this.generateCalendar();
    this.fetchData();
  }

  generateCalendar() {
    const date = this.currentMonth();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: DaySummary[] = [];

    // Previous Month Padding
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const padDate = new Date(year, month, -i);
      days.push({
        date: padDate,
        day: padDate.getDate(),
        isToday: false,
        isCurrentMonth: false,
        attendanceCount: 0,
        lateCount: 0,
        records: []
      });
    }

    // Current Month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currDate = new Date(year, month, i);
      const isToday = new Date().toDateString() === currDate.toDateString();
      days.push({
        date: currDate,
        day: i,
        isToday: isToday,
        isCurrentMonth: true,
        attendanceCount: 0,
        lateCount: 0,
        records: []
      });
    }

    this.calendarDays.set(days);
  }

  fetchData() {
    const date = this.currentMonth();
    this.attendanceService.getMonthly(date.getFullYear(), date.getMonth() + 1)
      .subscribe({
        next: (data) => this.mapDataToCalendar(data),
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los registros' });
          // Keep calendar empty but generated
        }
      });
  }

  mapDataToCalendar(records: AttendanceRecord[]) {
    let monthTotal = 0;
    let monthLate = 0;

    this.calendarDays.update(days => {
      return days.map(d => {
        if (!d.isCurrentMonth) return d;

        const dayRecords = records.filter(r => {
          const rDate = new Date(r.clockInTime);
          return rDate.getDate() === d.day;
        });

        const late = dayRecords.filter(r => r.status === 'LATE').length;

        monthTotal += dayRecords.length;
        monthLate += late;

        return {
          ...d,
          attendanceCount: dayRecords.length,
          lateCount: late,
          records: dayRecords
        };
      });
    });

    this.totalAttendance.set(monthTotal);
    this.totalLate.set(monthLate);
  }

  openDayDetails(day: DaySummary) {
    if (day.records.length > 0) {
      this.selectedDay.set(day);
      this.showDetails = true;
    }
  }

  getSeverity(status: string) {
    if (status === 'LATE') return 'warning';
    if (status === 'PRESENT' || status === 'COMPLETED') return 'success';
    return 'info';
  }

  getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      'PRESENT': 'Presente',
      'LATE': 'Atrasado',
      'ABSENT': 'Ausente',
      'Left Early': 'Salida Anticipada'
    };
    return labels[status] || status;
  }

  getInitials(name?: string) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
