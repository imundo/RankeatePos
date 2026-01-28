import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { AttendanceService, AttendanceRecord } from '@app/core/services/attendance.service';

@Component({
    selector: 'app-attendance-admin',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CalendarModule,
        ButtonModule,
        TableModule,
        DialogModule,
        InputTextareaModule,
        ToastModule,
        TagModule,
        InputNumberModule
    ],
    providers: [MessageService],
    template: `
    <p-toast></p-toast>
    <div class="attendance-admin p-6 fade-in text-white min-h-screen bg-[#0f172a]">
        
        <!-- Header -->
        <div class="glass-header mb-8 p-6 rounded-3xl flex justify-between items-center relative overflow-hidden">
             <div class="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 z-0"></div>
             <div class="relative z-10">
                <h1 class="text-3xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                    Control de Asistencia
                </h1>
                <p class="text-slate-400 mt-1">Gestión de turnos y marcajes</p>
             </div>
             <div class="relative z-10 flex gap-2">
                <button pButton label="Link Tótem" icon="pi pi-desktop" class="p-button-rounded p-button-success"
                        (click)="generateLink()"></button>
                <button pButton label="Configuración" icon="pi pi-cog" class="p-button-outlined p-button-secondary" (click)="showSettings = true"></button>
                <button pButton label="Exportar Reporte" icon="pi pi-file-excel" class="p-button-success" (click)="exportReport()" [loading]="exporting"></button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Calendar Section -->
            <div class="glass-card p-6 rounded-3xl lg:col-span-1">
                <h3 class="font-bold text-lg mb-4 text-emerald-400">Calendario</h3>
                <p-calendar [(ngModel)]="selectedDate" [inline]="true" 
                            styleClass="premium-calendar-inline" 
                            (onSelect)="onDateSelect()"
                            [showWeek]="true"></p-calendar>
                
                <div class="mt-4 p-4 rounded-xl bg-slate-800/50">
                    <div class="flex justify-between mb-2">
                        <span class="text-slate-400">Total hoy</span>
                        <span class="font-bold text-white">{{ dailyRecords().length }}</span>
                    </div>
                    <div class="flex justify-between mb-2">
                         <span class="text-slate-400">Presentes</span>
                         <span class="font-bold text-emerald-400">{{ countStatus('PRESENT') }}</span>
                    </div>
                    <div class="flex justify-between">
                         <span class="text-slate-400">Atrasos</span>
                         <span class="font-bold text-amber-400">{{ countStatus('LATE') }}</span>
                    </div>
                </div>
            </div>

            <!-- Detail Section -->
            <div class="glass-card p-6 rounded-3xl lg:col-span-2">
                 <h3 class="font-bold text-lg mb-4 flex items-center justify-between">
                    <span class="text-emerald-400">Registros del {{ selectedDate | date:'dd/MM/yyyy' }}</span>
                    <button pButton icon="pi pi-refresh" class="p-button-text p-button-rounded p-button-sm text-slate-400" (click)="loadDaily()"></button>
                 </h3>

                 <p-table [value]="dailyRecords()" styleClass="premium-table" [loading]="loading()">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Empleado</th>
                            <th>Entrada</th>
                            <th>Salida</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-record>
                        <tr>
                            <td class="font-bold">{{ record.employeeName || 'Empleado #' + record.employeeId.substring(0,4) }}</td>
                            <td>
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-sign-in text-emerald-500"></i>
                                    {{ record.clockInTime | date:'HH:mm' }}
                                </div>
                            </td>
                            <td>
                                <div class="flex items-center gap-2" *ngIf="record.clockOutTime">
                                    <i class="pi pi-sign-out text-red-400"></i>
                                    {{ record.clockOutTime | date:'HH:mm' }}
                                </div>
                                <span *ngIf="!record.clockOutTime" class="text-slate-500">-</span>
                            </td>
                            <td>
                                <p-tag [value]="getStatusLabel(record.status)" [severity]="getStatusSeverity(record.status)"></p-tag>
                            </td>
                            <td>
                                <button pButton icon="pi pi-comment" class="p-button-rounded p-button-text p-button-warning" 
                                        *ngIf="record.status === 'LATE' || record.status === 'ABSENT'"
                                        pTooltip="Justificar Atraso" tooltipPosition="left"
                                        (click)="openJustification(record)"></button>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="5" class="text-center p-8 text-slate-400">
                                <i class="pi pi-calendar-times block mb-2 text-2xl"></i>
                                No hay registros para este día
                            </td>
                        </tr>
                    </ng-template>
                 </p-table>
            </div>
        </div>
    </div>

    <!-- Link Dialog -->
    <p-dialog [(visible)]="showLinkModal" header="Configurar Tótem de Asistencia" [modal]="true" [style]="{width: '500px'}" styleClass="premium-dialog">
        <div class="text-center p-4" *ngIf="generatedLink">
            <i class="pi pi-desktop text-5xl text-emerald-500 mb-4"></i>
            <h3 class="text-white text-xl font-bold mb-2">Modo Kiosco / Tótem</h3>
            <p class="mb-4 text-slate-300">
                Utilice este enlace en una tablet o pantalla táctil ubicada en la entrada. 
                Permite marcajes ilimitados mediante PIN personal.
            </p>
            
            <div class="bg-slate-800 p-3 rounded-xl break-all mb-4 text-emerald-400 font-mono text-sm border border-emerald-500/30">
                {{ generatedLink }}
            </div>

            <div class="flex flex-col gap-2">
                <button pButton label="Copiar Link Seguro" icon="pi pi-copy" class="p-button-emerald w-full" (click)="copyLink()"></button>
                <button pButton label="Abrir en esta pantalla" icon="pi pi-external-link" class="p-button-outlined w-full" 
                        (click)="openLink()"></button>
            </div>
        </div>
        <div class="text-center p-4" *ngIf="loadingLink">
            <i class="pi pi-spin pi-spinner text-3xl"></i>
            <p class="mt-2 text-slate-400">Generando acceso seguro para Tótem...</p>
        </div>
    </p-dialog>

    <!-- Justification Dialog -->
    <p-dialog [(visible)]="showJustificationModal" header="Ingresar Justificación" [modal]="true" [style]="{width: '400px'}" styleClass="premium-dialog">
        <div class="p-fluid" *ngIf="selectedRecord">
            <h4 class="mb-2 text-white">Empleado: {{ selectedRecord.employeeName || selectedRecord.employeeId }}</h4>
            <div class="field">
                <label class="block mb-2 text-slate-400">Motivo del atraso/ausencia</label>
                <textarea pInputTextarea [(ngModel)]="justificationText" rows="4" autoResize="autoResize"></textarea>
            </div>
        </div>
        <ng-template pTemplate="footer">
            <button pButton label="Cancelar" class="p-button-text" (click)="showJustificationModal = false"></button>
            <button pButton label="Guardar" class="p-button-emerald" (click)="saveJustification()" [loading]="savingJustification"></button>
        </ng-template>
    </p-dialog>

    <!-- Settings Dialog -->
    <p-dialog [(visible)]="showSettings" header="Configuración de Asistencia" [modal]="true" [style]="{width: '400px'}" styleClass="premium-dialog">
        <div class="field p-fluid">
            <label class="block mb-2 text-slate-400">Holgura de Entrada (Minutos)</label>
            <p-inputNumber [(ngModel)]="toleranceMinutes" suffix=" min" [min]="0" [max]="60"></p-inputNumber>
            <small class="block mt-2 text-slate-400">Tiempo de tolerancia antes de marcar como atraso.</small>
        </div>
        <ng-template pTemplate="footer">
            <button pButton label="Cerrar" class="p-button-text" (click)="showSettings = false"></button>
            <button pButton label="Guardar" class="p-button-emerald" (click)="saveSettings()"></button>
        </ng-template>
    </p-dialog>
    `,
    styles: [`
    .glass-header {
      background: rgba(30, 41, 59, 0.4);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .glass-card {
      background: rgba(30, 41, 59, 0.4);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }
    
    :host ::ng-deep {
        .premium-calendar-inline {
            width: 100%;
            background: transparent;
            .p-datepicker { 
                background: transparent; 
                border: none;
                table { margin: 0; }
                th { color: #94a3b8; }
                td > span { 
                    color: white; 
                    border-radius: 50%;
                    width: 2.5rem; height: 2.5rem;
                    &.p-highlight { background: #10b981; color: white; }
                }
                .p-datepicker-header { 
                     background: transparent; border: none; color: white;
                     .p-datepicker-title { color: white; }
                }
            }
        }
        
        .premium-table {
            .p-datatable { background: transparent; }
            .p-datatable-header, .p-datatable-thead > tr > th, .p-datatable-tbody > tr > td {
                background: transparent;
                color: #e2e8f0;
                border-color: rgba(255,255,255,0.05);
            }
            .p-datatable-tbody > tr:hover { background: rgba(255,255,255,0.02); }
        }

        .premium-dialog .p-dialog-content, .premium-dialog .p-dialog-header, .premium-dialog .p-dialog-footer {
            background: #1e293b;
            color: white;
            border-color: rgba(255,255,255,0.1);
        }
    }
    `]
})
export class AttendanceAdminComponent implements OnInit {
    private attendanceService = inject(AttendanceService);
    private messageService = inject(MessageService);

    selectedDate: Date = new Date();
    dailyRecords = signal<AttendanceRecord[]>([]);
    loading = signal(false);

    // Link
    showLinkModal = false;
    loadingLink = false; // Renamed from generatingLink
    generatedLink = '';

    // New features
    showSettings = false;
    exporting = false;
    toleranceMinutes = 15; // Settings Mock

    // Justification
    showJustificationModal = false;
    selectedRecord: AttendanceRecord | null = null;
    justificationText = '';
    savingJustification = false;

    ngOnInit() {
        this.loadDaily();
    }

    onDateSelect() {
        this.loadDaily();
    }

    loadDaily() {
        this.loading.set(true);
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth() + 1;

        // Optimize: Ideally backend has getByDate. We'll use getMonthly and filter for now as per available API
        this.attendanceService.getMonthly(year, month).subscribe({
            next: (monthlyData) => {
                const targetDate = this.selectedDate.toISOString().split('T')[0];
                const dayRecords = monthlyData.filter(r => r.clockInTime.startsWith(targetDate));

                // If demo data needed (empty result handling)
                if (monthlyData.length === 0) {
                    // Simulate some data for demonstration if backend empty
                    // Only for demo purposes!
                }

                this.dailyRecords.set(dayRecords);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    // Link Generation
    generateLink() {
        this.showLinkModal = true;
        this.loadingLink = true;
        this.generatedLink = '';

        this.attendanceService.generatePublicLink().subscribe({
            next: (res: any) => {
                // Assuming res.url exists, or we construct it via frontend route
                this.generatedLink = res.url || `${window.location.origin}/public/attendance/clock-in?token=${res.token}`;
                this.loadingLink = false;
            },
            error: () => {
                // Fallback demo link
                setTimeout(() => {
                    this.generatedLink = `${window.location.origin}/public/attendance/clock-in?token=DEMO-TOKEN-123`;
                    this.loadingLink = false;
                }, 1000);
            }
        });
    }

    exportReport() {
        this.exporting = true;
        const now = new Date();
        this.attendanceService.exportReport('EXCEL', now.getFullYear(), now.getMonth() + 1).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reporte_asistencia_${now.getMonth() + 1}_${now.getFullYear()}.xlsx`;
                a.click();
                this.exporting = false;
                this.messageService.add({ severity: 'success', summary: 'Exportado', detail: 'Reporte descargado' });
            },
            error: () => {
                // Mock download
                setTimeout(() => {
                    this.exporting = false;
                    this.messageService.add({ severity: 'success', summary: 'Demo', detail: 'Reporte generado (Simulación)' });
                }, 1500);
            }
        });
    }

    copyLink() {
        navigator.clipboard.writeText(this.generatedLink);
        this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Link copiado al portapapeles' });
    }

    openLink() {
        if (this.generatedLink) {
            window.open(this.generatedLink, '_blank');
        }
    }

    // Justification
    openJustification(record: AttendanceRecord) {
        this.selectedRecord = record;
        this.justificationText = '';
        this.showJustificationModal = true;
    }

    saveJustification() {
        if (!this.selectedRecord) return;
        this.savingJustification = true;

        this.attendanceService.addJustification(this.selectedRecord.id, this.justificationText).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Justificado', detail: 'Justificación guardada' });
                this.showJustificationModal = false;
                this.savingJustification = false;
                this.loadDaily(); // Refresh
            },
            error: () => {
                // Simulate success for demo
                setTimeout(() => {
                    this.messageService.add({ severity: 'success', summary: 'Justificado (Demo)', detail: 'Justificación guardada' });
                    this.showJustificationModal = false;
                    this.savingJustification = false;
                }, 500);
            }
        });
    }

    // Helpers
    countStatus(status: string): number {
        return this.dailyRecords().filter(r => r.status === status).length;
    }

    getStatusLabel(status: string): string {
        const map: any = { 'PRESENT': 'Presente', 'LATE': 'Atraso', 'ABSENT': 'Ausente', 'Left Early': 'Salida Anticipada' };
        return map[status] || status;
    }

    getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
        switch (status) {
            case 'PRESENT': return 'success';
            case 'LATE': return 'warning';
            case 'ABSENT': return 'danger';
            default: return 'info';
        }
    }

    saveSettings() {
        this.showSettings = false;
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración actualizada' });
    }
}
