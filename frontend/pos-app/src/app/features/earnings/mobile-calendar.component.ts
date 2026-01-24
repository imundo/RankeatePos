import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-mobile-calendar',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="mobile-calendar-container">
      <!-- Month Navigation Header -->
      <div class="calendar-header">
        <button class="nav-btn" (click)="prevMonth()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h2 class="month-title">{{ currentMonthName() }} {{ currentYear() }}</h2>
        <button class="nav-btn" (click)="nextMonth()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <!-- Weekdays Header -->
      <div class="weekdays-grid">
        @for (day of weekdays; track day) {
          <span class="weekday">{{ day }}</span>
        }
      </div>

      <!-- Days Grid -->
      <div class="days-grid">
        @for (day of days(); track day.dateStr) {
          <button 
            class="day-cell"
            [class.other-month]="!day.isCurrentMonth"
            [class.today]="day.isToday"
            [class.selected]="day.isSelected"
            [class.has-data]="day.hasData"
            (click)="selectDay(day)"
          >
            <span class="day-number">{{ day.dayNumber }}</span>
            @if (day.hasData && day.isCurrentMonth) {
              <span class="dot-indicator"></span>
            }
          </button>
        }
      </div>

      <!-- Selected Day Details Sheet -->
      @if (selectedDaySummary()) {
        <div class="day-details-sheet">
          <div class="sheet-header">
            <h3>{{ selectedDateFormatted() }}</h3>
            @if (isToday(selectedDate)) {
              <span class="today-badge">Hoy</span>
            }
          </div>
          
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">Ventas</span>
              <span class="stat-value text-emerald-400">{{ formatPrice(selectedDaySummary()?.totalVentas || 0) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Tx</span>
              <span class="stat-value text-white">{{ selectedDaySummary()?.totalTransacciones || 0 }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .mobile-calendar-container {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      padding: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .month-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      text-transform: capitalize;
      color: white;
    }

    .nav-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border: none;
      border-radius: 8px;
      color: white;
      
      svg { width: 16px; height: 16px; }
    }

    .weekdays-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .weekday {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
      font-weight: 500;
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }

    .day-cell {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: white;
      position: relative;
      font-size: 0.9rem;
      
      &.other-month {
        opacity: 0.3;
      }

      &.today {
        border: 1px solid #6366f1;
        color: #6366f1;
        font-weight: 700;
      }

      &.selected {
        background: #6366f1;
        color: white;
        font-weight: 600;
      }

      &.has-data:not(.selected) {
        background: rgba(255, 255, 255, 0.03);
      }
    }

    .dot-indicator {
      width: 4px;
      height: 4px;
      background: #10b981;
      border-radius: 50%;
      position: absolute;
      bottom: 6px;
    }

    .day-details-sheet {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      animation: slideUp 0.3s ease-out;
    }

    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      
      h3 { margin: 0; font-size: 1rem; color: white; }
    }

    .today-badge {
      padding: 2px 8px;
      background: #6366f1;
      border-radius: 12px;
      font-size: 0.7rem;
      color: white;
    }

    .stats-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .stat-item {
      background: rgba(0, 0, 0, 0.2);
      padding: 0.75rem;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 2px;
    }

    .stat-value {
      font-size: 1rem;
      font-weight: 600;
    }

    .text-emerald-400 { color: #34d399; }
    .text-white { color: white; }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class MobileCalendarComponent {
    @Input() set initialDate(date: Date) {
        this.currentDate.set(new Date(date));
    }
    @Input() selectedDate = new Date();
    @Input() salesData: Record<string, any> = {};

    @Output() dateSelected = new EventEmitter<Date>();
    @Output() monthChange = new EventEmitter<Date>();

    currentDate = signal(new Date());
    weekdays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    days = computed(() => {
        const year = this.currentDate().getFullYear();
        const month = this.currentDate().getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Adjust start day to Sunday=0
        const startDayIndex = firstDay.getDay();

        const daysArr = [];

        // Prev Month Padding
        for (let i = startDayIndex - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            daysArr.push(this.createDayObj(d, false));
        }

        // Current Month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            daysArr.push(this.createDayObj(d, true));
        }

        // Next Month Padding (fill to 42 cells for consistent height)
        const remaining = 42 - daysArr.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(year, month + 1, i);
            daysArr.push(this.createDayObj(d, false));
        }

        return daysArr;
    });

    private createDayObj(date: Date, isCurrentMonth: boolean) {
        const dateStr = this.formatDateKey(date);
        return {
            date,
            dateStr,
            dayNumber: date.getDate(),
            isCurrentMonth,
            isToday: this.isToday(date),
            isSelected: this.isSameDay(date, this.selectedDate),
            hasData: !!this.salesData[dateStr] && this.salesData[dateStr].totalVentas > 0
        };
    }

    currentMonthName = computed(() =>
        this.currentDate().toLocaleDateString('es-CL', { month: 'long' })
    );

    currentYear = computed(() => this.currentDate().getFullYear());

    selectedDaySummary = computed(() => {
        return this.salesData[this.formatDateKey(this.selectedDate)];
    });

    prevMonth() {
        const d = new Date(this.currentDate());
        d.setMonth(d.getMonth() - 1);
        this.currentDate.set(d);
        this.monthChange.emit(d);
    }

    nextMonth() {
        const d = new Date(this.currentDate());
        d.setMonth(d.getMonth() + 1);
        this.currentDate.set(d);
        this.monthChange.emit(d);
    }

    selectDay(day: any) {
        this.selectedDate = day.date;
        this.dateSelected.emit(day.date);
    }

    formatPrice(val: number) {
        return '$' + val.toLocaleString('es-CL');
    }

    selectedDateFormatted() {
        return this.selectedDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    // Helpers
    isToday(d: Date) {
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    }

    isSameDay(d1: Date, d2: Date) {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    }

    private formatDateKey(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
}
