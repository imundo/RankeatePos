import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ShiftService, Shift } from '@app/core/services/shift.service';
import { StaffService, Employee } from '@app/core/services/staff.service';

@Component({
    selector: 'app-shift-admin',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, DialogModule,
        CalendarModule, DropdownModule, TooltipModule, AvatarModule, ToastModule
    ],
    providers: [MessageService],
    template: `
    <p-toast></p-toast>
    <div class="shifts-container fade-in">
        <div class="page-header">
            <div class="header-content">
                <h1>📅 Gestión de Turnos</h1>
                <p class="subtitle">Planificación semanal de horarios</p>
            </div>
            <div class="header-actions">
                <div class="week-navigator">
                    <button pButton icon="pi pi-chevron-left" class="p-button-text text-white" (click)="prevWeek()"></button>
                    <span class="week-label">{{ weekLabel() }}</span>
                    <button pButton icon="pi pi-chevron-right" class="p-button-text text-white" (click)="nextWeek()"></button>
                </div>
                <button pButton label="Nuevo Turno" icon="pi pi-plus" class="p-button-rounded p-button-success" (click)="openCreateModal()"></button>
            </div>
        </div>

        <!-- Weekly Calendar Grid -->
        <div class="calendar-wrapper glass-card">
            <div class="calendar-header">
                <div class="employee-header-cell">Empleado</div>
                <div class="day-header" *ngFor="let day of weekDays()">
                    <span class="day-name">{{ day | date:'EEE':'':'es-CL' | uppercase }}</span>
                    <span class="day-number">{{ day | date:'d' }}</span>
                </div>
            </div>

            <div class="calendar-body">
                <div class="employee-row" *ngFor="let emp of employees()">
                    <div class="employee-cell">
                        <p-avatar [label]="emp.firstName.charAt(0)" shape="circle" styleClass="mr-2"></p-avatar>
                        <div class="emp-info">
                            <span class="emp-name">{{ emp.firstName }} {{ emp.lastName }}</span>
                            <span class="emp-role">{{ emp.position || 'Staff' }}</span>
                        </div>
                    </div>
                    
                    <div class="day-cell" *ngFor="let day of weekDays()" (click)="onCellClick(emp, day)">
                        <!-- Shifts for this employee on this day -->
                        <div class="shift-card" 
                             *ngFor="let shift of getShiftsFor(emp.id, day)"
                             [class.morning]="shift.type === 'MORNING'"
                             [class.afternoon]="shift.type === 'AFTERNOON'"
                             [class.night]="shift.type === 'NIGHT'"
                             (click)="$event.stopPropagation(); editShift(shift)">
                             
                            <span class="shift-time">{{ shift.startTime | date:'HH:mm' }} - {{ shift.endTime | date:'HH:mm' }}</span>
                            <span class="shift-type">{{ shift.type | slice:0:1 }}</span>
                        </div>
                        
                        <div class="add-indicator">
                            <i class="pi pi-plus"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Create/Edit Shift Dialog -->
    <p-dialog [(visible)]="showDialog" [header]="'Asignar Turno'" [modal]="true" [style]="{width: '400px'}" styleClass="glass-dialog">
        <div class="form-grid">
            <div class="field">
                <label>Empleado</label>
                <div class="emp-display" *ngIf="selectedEmployee">
                    {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}
                </div>
            </div>
            
            <div class="field">
                <label>Fecha</label>
                <div class="date-display" *ngIf="selectedDate">
                    {{ selectedDate | date:'fullDate':'':'es-CL' | titlecase }}
                </div>
            </div>

            <div class="field">
                <label>Tipo de Turno</label>
                <p-dropdown [options]="shiftTypes" [(ngModel)]="form.type" optionLabel="label" optionValue="value" (onChange)="onTypeChange()"></p-dropdown>
            </div>

            <div class="field-row">
                <div class="field">
                    <label>Inicio</label>
                    <p-calendar [(ngModel)]="form.startTime" [timeOnly]="true" dataType="date"></p-calendar>
                </div>
                <div class="field">
                    <label>Fin</label>
                    <p-calendar [(ngModel)]="form.endTime" [timeOnly]="true" dataType="date"></p-calendar>
                </div>
            </div>
        </div>
        <ng-template pTemplate="footer">
            <button pButton label="Cancelar" class="p-button-text" (click)="showDialog = false"></button>
            <button pButton label="Guardar" class="p-button-primary" (click)="saveShift()" [loading]="saving"></button>
        </ng-template>
    </p-dialog>
    `,
    styles: [`
    .shifts-container {
        padding: 2rem;
        background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 40%),
                    radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.1), transparent 40%);
        min-height: 100vh;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .header-content h1 {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 800;
        letter-spacing: -1px;
        background: linear-gradient(135deg, #fff 30%, #a5b4fc 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .subtitle { color: #94A3B8; margin-top: 0.5rem; }

    .week-navigator {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: rgba(255,255,255,0.05);
        padding: 0.5rem;
        border-radius: 99px;
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    .week-label { font-weight: 600; color: white; min-width: 200px; text-align: center; }

    .glass-card {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        backdrop-filter: blur(12px);
        overflow: hidden;
    }

    .calendar-wrapper {
        display: flex;
        flex-direction: column;
    }

    .calendar-header {
        display: grid;
        grid-template-columns: 250px repeat(7, 1fr);
        border-bottom: 1px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.02);
    }

    .employee-header-cell {
        padding: 1rem;
        color: #94A3B8;
        font-weight: 600;
        display: flex;
        align-items: center;
    }

    .day-header {
        padding: 1rem;
        text-align: center;
        border-left: 1px solid rgba(255,255,255,0.05);
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .day-name { font-size: 0.8rem; color: #94A3B8; font-weight: 600; }
    .day-number { font-size: 1.25rem; color: white; font-weight: 700; }

    .calendar-body {
        display: flex;
        flex-direction: column;
    }

    .employee-row {
        display: grid;
        grid-template-columns: 250px repeat(7, 1fr);
        border-bottom: 1px solid rgba(255,255,255,0.05);
        min-height: 100px;
    }

    .employee-cell {
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        background: rgba(255,255,255,0.01);
    }

    .emp-info { display: flex; flex-direction: column; }
    .emp-name { color: white; font-weight: 600; font-size: 0.95rem; }
    .emp-role { color: #64748B; font-size: 0.8rem; }

    .day-cell {
        border-left: 1px solid rgba(255,255,255,0.05);
        padding: 0.5rem;
        position: relative;
        cursor: pointer;
        transition: background 0.2s;
        
        &:hover {
            background: rgba(255,255,255,0.03);
            .add-indicator { opacity: 1; }
        }
    }

    .add-indicator {
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 30px; height: 30px;
        background: rgba(255,255,255,0.1);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: white;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .shift-card {
        padding: 0.5rem;
        border-radius: 8px;
        margin-bottom: 0.4rem;
        background: #334155;
        border-left: 3px solid #64748B;
        color: white;
        font-size: 0.8rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        cursor: pointer;
        
        &:hover { filter: brightness(1.1); }
    }

    .shift-card.morning { background: rgba(16, 185, 129, 0.2); border-left-color: #10B981; }
    .shift-card.afternoon { background: rgba(245, 158, 11, 0.2); border-left-color: #F59E0B; }
    .shift-card.night { background: rgba(139, 92, 246, 0.2); border-left-color: #8B5CF6; }

    .field { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    label { color: #94A3B8; font-size: 0.9rem; }
    .emp-display, .date-display { color: white; font-weight: 600; font-size: 1.1rem; }
    `]
})
export class ShiftAdminComponent implements OnInit {
    private shiftService = inject(ShiftService);
    private staffService = inject(StaffService);
    private messageService = inject(MessageService);

    currentWeekStart = signal(this.getStartOfWeek(new Date()));
    shifts = signal<Shift[]>([]);
    employees = signal<Employee[]>([]);

    showDialog = false;
    saving = false;
    selectedEmployee: any = null;
    selectedDate: Date | null = null;

    form = {
        type: 'MORNING',
        startTime: new Date(),
        endTime: new Date()
    };

    shiftTypes = [
        { label: 'Mañana (08:00 - 16:00)', value: 'MORNING' },
        { label: 'Tarde (14:00 - 22:00)', value: 'AFTERNOON' },
        { label: 'Noche (22:00 - 06:00)', value: 'NIGHT' },
        { label: 'Personalizado', value: 'CUSTOM' }
    ];

    weekDays = computed(() => {
        const start = this.currentWeekStart();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    });

    weekLabel = computed(() => {
        const start = this.currentWeekStart();
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })} - ${end.getDate()} ${end.toLocaleString('default', { month: 'short' })}`;
    });

    ngOnInit() {
        this.loadEmployees();
        this.loadShifts();
    }

    loadEmployees() {
        this.staffService.getAllActive().subscribe(emps => {
            this.employees.set(emps);
        });
    }

    loadShifts() {
        const start = this.currentWeekStart();
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        this.shiftService.getShifts(start, end).subscribe(data => {
            this.shifts.set(data);
        });
    }

    prevWeek() {
        const d = new Date(this.currentWeekStart());
        d.setDate(d.getDate() - 7);
        this.currentWeekStart.set(d);
        this.loadShifts();
    }

    nextWeek() {
        const d = new Date(this.currentWeekStart());
        d.setDate(d.getDate() + 7);
        this.currentWeekStart.set(d);
        this.loadShifts();
    }

    getShiftsFor(empId: string, day: Date) {
        return this.shifts().filter(s => {
            const shiftDate = new Date(s.startTime);
            return s.employee.id === empId &&
                shiftDate.getDate() === day.getDate() &&
                shiftDate.getMonth() === day.getMonth();
        });
    }

    onCellClick(emp: any, day: Date) {
        this.selectedEmployee = emp;
        this.selectedDate = day;
        this.form.type = 'MORNING';
        this.onTypeChange(); // Set default times
        this.showDialog = true;
    }

    editShift(shift: Shift) {
        // Implementation for edit
    }

    openCreateModal() {
        // Generic open without pre-selection
        this.showDialog = true;
    }

    onTypeChange() {
        if (!this.selectedDate) return;
        const base = new Date(this.selectedDate);

        if (this.form.type === 'MORNING') {
            this.form.startTime = this.setHours(base, 8, 0);
            this.form.endTime = this.setHours(base, 16, 0);
        } else if (this.form.type === 'AFTERNOON') {
            this.form.startTime = this.setHours(base, 14, 0);
            this.form.endTime = this.setHours(base, 22, 0);
        } else if (this.form.type === 'NIGHT') {
            this.form.startTime = this.setHours(base, 22, 0);
            const nextDay = new Date(base);
            nextDay.setDate(nextDay.getDate() + 1);
            this.form.endTime = this.setHours(nextDay, 6, 0);
        }
    }

    setHours(date: Date, h: number, m: number) {
        const d = new Date(date);
        d.setHours(h, m, 0, 0);
        return d;
    }

    saveShift() {
        if (!this.selectedEmployee || !this.selectedDate) return;

        this.saving = true;

        // Combine Date + Time
        const start = new Date(this.selectedDate);
        start.setHours(this.form.startTime.getHours(), this.form.startTime.getMinutes());

        const end = new Date(this.selectedDate);
        // Handle overnight (if end hour < start hour usually implies next day, but for now simple logic)
        if (this.form.type === 'NIGHT') {
            end.setDate(end.getDate() + 1);
        }
        end.setHours(this.form.endTime.getHours(), this.form.endTime.getMinutes());

        this.shiftService.createShift({
            employeeId: this.selectedEmployee.id,
            start: start.toISOString(),
            end: end.toISOString(),
            type: this.form.type
        }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Turno asignado' });
                this.showDialog = false;
                this.loadShifts();
                this.saving = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo asignar turno' });
                this.saving = false;
            }
        });
    }

    private getStartOfWeek(date: Date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        return new Date(d.setDate(diff));
    }
}
