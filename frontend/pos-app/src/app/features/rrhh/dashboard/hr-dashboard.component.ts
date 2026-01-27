import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonModule } from 'primeng/skeleton';

import { DemoDataService } from '@app/core/services/demo-data.service';
import { StaffService } from '@app/core/services/staff.service';
import { AttendanceService } from '@app/core/services/attendance.service';
import { PayrollService } from '@app/core/services/payroll.service';
import { PerformanceReviewService } from '@app/core/services/performance-review.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
    selector: 'app-hr-dashboard',
    standalone: true,
    imports: [CommonModule, ChartModule, FormsModule, CalendarModule, DropdownModule, SkeletonModule],
    template: `
    <div class="hr-dashboard min-h-screen bg-[#0f172a] text-white p-6 fade-in">
      
      <!-- Header & Filters -->
      <div class="glass-header mb-8 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 z-0"></div>
        
        <div class="relative z-10">
          <h1 class="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            HR Analytics 
          </h1>
          <p class="text-slate-400 mt-1">Visión estratégica del talento humano</p>
        </div>

        <!-- Filter Bar -->
        <div class="relative z-10 flex flex-wrap gap-4 items-center">
             <div class="filter-group">
                <p-calendar [(ngModel)]="dateRange" selectionMode="range" [readonlyInput]="true" 
                           placeholder="Rango de Fechas" styleClass="premium-calendar"
                           (onSelect)="updateCharts()"></p-calendar>
             </div>
             
             <div class="filter-group">
                <p-dropdown [options]="departments" [(ngModel)]="selectedDepartment" 
                           placeholder="Departamento" styleClass="premium-dropdown"
                           (onChange)="updateCharts()" [showClear]="true"></p-dropdown>
             </div>

             <div class="glass-pill" *ngIf="!loading()">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>En vivo</span>
             </div>
        </div>
      </div>

      <!-- KPI Cards Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <!-- Total Staff -->
        <div class="glass-card p-6 rounded-3xl relative group">
           <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all"></div>
           <div class="relative z-10 flex justify-between items-start">
              <div>
                  <p class="text-slate-400 text-sm font-medium mb-1">Total Colaboradores</p>
                  <h3 class="text-3xl font-bold" *ngIf="!loading(); else loader">{{ kpis().totalStaff }}</h3>
                  <ng-template #loader><p-skeleton width="3rem" height="2rem"></p-skeleton></ng-template>
              </div>
              <div class="icon-box bg-blue-500/20 text-blue-300">
                  <i class="pi pi-users text-xl"></i>
              </div>
           </div>
           <div class="mt-4 flex gap-2 text-xs text-slate-400">
              <span class="text-emerald-400 font-bold">98%</span> Activos
           </div>
        </div>

        <!-- Attendance Rate -->
        <div class="glass-card p-6 rounded-3xl relative group">
           <div class="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all"></div>
           <div class="relative z-10 flex justify-between items-start">
              <div>
                  <p class="text-slate-400 text-sm font-medium mb-1">Asistencia (Mes)</p>
                  <h3 class="text-3xl font-bold" *ngIf="!loading(); else loader">{{ kpis().attendanceRate }}%</h3>
              </div>
              <div class="icon-box bg-emerald-500/20 text-emerald-300">
                  <i class="pi pi-clock text-xl"></i>
              </div>
           </div>
           <div class="mt-4 flex gap-2 text-xs text-slate-400">
              <span class="text-amber-400 font-bold">{{ kpis().lateArrivals }}</span> Atrasos detectados
           </div>
        </div>

        <!-- Payroll -->
        <div class="glass-card p-6 rounded-3xl relative group">
           <div class="absolute -right-6 -top-6 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl group-hover:bg-violet-500/30 transition-all"></div>
           <div class="relative z-10 flex justify-between items-start">
              <div>
                  <p class="text-slate-400 text-sm font-medium mb-1">Costo Nómina</p>
                  <h3 class="text-3xl font-bold" *ngIf="!loading(); else loader">\${{ kpis().payrollCost | number }}</h3>
              </div>
              <div class="icon-box bg-violet-500/20 text-violet-300">
                  <i class="pi pi-money-bill text-xl"></i>
              </div>
           </div>
           <div class="mt-4 flex gap-2 text-xs text-slate-400">
              <span class="text-emerald-400 font-bold">+2.5%</span> vs mes anterior
           </div>
        </div>

        <!-- Performance -->
        <div class="glass-card p-6 rounded-3xl relative group">
           <div class="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all"></div>
           <div class="relative z-10 flex justify-between items-start">
              <div>
                  <p class="text-slate-400 text-sm font-medium mb-1">Desempeño Promedio</p>
                  <h3 class="text-3xl font-bold" *ngIf="!loading(); else loader">{{ kpis().avgPerformance }}%</h3>
              </div>
              <div class="icon-box bg-amber-500/20 text-amber-300">
                  <i class="pi pi-star text-xl"></i>
              </div>
           </div>
           <div class="mt-4 w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
               <div class="h-full bg-amber-500 rounded-full" [style.width.%]="kpis().avgPerformance"></div>
           </div>
        </div>

      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        
        <!-- Attendance vs Shifts Chart -->
        <div class="glass-card p-6 rounded-3xl flex flex-col">
           <h3 class="font-bold text-lg mb-6 flex items-center gap-2">
              <span class="w-1 h-6 bg-emerald-500 rounded-full"></span>
              Tendencia de Asistencia
           </h3>
           <div class="flex-1 relative w-full h-full min-h-0">
               <p-chart type="bar" [data]="attendanceChartData" [options]="chartOptions" height="100%"></p-chart>
           </div>
        </div>

        <!-- Performance Distribution -->
        <div class="glass-card p-6 rounded-3xl flex flex-col">
            <h3 class="font-bold text-lg mb-6 flex items-center gap-2">
              <span class="w-1 h-6 bg-amber-500 rounded-full"></span>
              Distribución de Evaluación
           </h3>
           <div class="flex-1 relative w-full h-full flex justify-center items-center">
               <div class="w-[300px] h-[300px]">
                   <p-chart type="doughnut" [data]="performanceChartData" [options]="doughnutOptions"></p-chart>
               </div>
           </div>
        </div>

      </div>

    </div>
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
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    .glass-pill {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0.5rem 1rem;
        border-radius: 99px;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .icon-box {
        width: 48px; height: 48px;
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
    }
    
    :host ::ng-deep {
        .premium-calendar .p-inputtext {
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(255,255,255,0.1);
            color: white;
            border-radius: 12px;
        }
        .premium-dropdown {
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            .p-dropdown-label { color: white; }
            .p-dropdown-trigger { color: rgba(255,255,255,0.6); }
        }
    }
  `]
})
export class HrDashboardComponent implements OnInit {
    private demoData = inject(DemoDataService);
    private staffService = inject(StaffService);
    private attendanceService = inject(AttendanceService);
    private payrollService = inject(PayrollService);
    private reviewService = inject(PerformanceReviewService);

    loading = signal(true);
    kpis = signal({
        totalStaff: 0,
        attendanceRate: 0,
        lateArrivals: 0,
        payrollCost: 0,
        avgPerformance: 0
    });

    // Filters
    dateRange: Date[] = [];
    selectedDepartment: string | null = null;
    departments = [
        { label: 'Cocina / Panadería', value: 'kitchen' },
        { label: 'Ventas / Salón', value: 'sales' },
        { label: 'Administración', value: 'admin' }
    ];

    attendanceChartData: any;
    performanceChartData: any;

    chartOptions: any;
    doughnutOptions: any;

    ngOnInit() {
        this.initChartsConfig();
        // Set default range (current month)
        const now = new Date();
        this.dateRange = [new Date(now.getFullYear(), now.getMonth(), 1), now];

        this.loadRealData();
    }

    loadRealData() {
        this.loading.set(true);

        const today = new Date();

        forkJoin({
            stats: this.staffService.getStats().pipe(catchError(() => of(null))),
            attendance: this.attendanceService.getMonthly(today.getFullYear(), today.getMonth() + 1).pipe(catchError(() => of([]))),
            payroll: this.payrollService.getHistory().pipe(catchError(() => of([]))),
            reviews: this.reviewService.getByEmployee('all').pipe(catchError(() => of([])))
        }).subscribe({
            next: (results) => {
                // Validar si usamos demo data
                const useDemo = !results.stats || (results.stats.totalEmployees === 0 && results.attendance.length === 0);

                if (useDemo) {
                    this.loadDemoData();
                } else {
                    this.processRealData(results);
                }
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading API data', err);
                this.loadDemoData();
                this.loading.set(false);
            }
        });
    }

    processRealData(data: any) {
        // 1. Staff
        const totalStaff = data.stats?.totalEmployees || 0;

        // 2. Attendance
        const totalRecords = data.attendance.length;
        const lateRecords = data.attendance.filter((r: any) => r.status === 'LATE').length;
        const attendanceRate = totalRecords > 0 ? Math.round(((totalRecords - lateRecords) / totalRecords) * 100) : 0;

        // 3. Payroll (Sum all from history)
        // Note: Ideally filter by current month, but for Dashboard View total is fine or last run
        const payrollCost = data.payroll.reduce((acc: number, curr: any) => acc + (curr.totalPaid || 0), 0);

        // 4. Performance
        const reviews = data.reviews || [];
        const totalScore = reviews.reduce((acc: number, curr: any) => acc + (curr.overallScore || 0), 0);
        const avgPerformance = reviews.length ? Math.round(totalScore / reviews.length) : 0;

        this.kpis.set({
            totalStaff,
            attendanceRate,
            lateArrivals: lateRecords,
            payrollCost,
            avgPerformance
        });

        this.updateChartsWithRealData(data.attendance, data.reviews);
    }

    loadDemoData() {
        const data = this.demoData.getTenantDemoData('demo').rrhh;

        this.kpis.set({
            totalStaff: data?.employees?.length || 12,
            attendanceRate: 92,
            lateArrivals: 3,
            payrollCost: 15420000,
            avgPerformance: 78
        });

        this.updateChartsDemo();
    }

    updateChartsWithRealData(attendance: any[], reviews: any[]) {
        // Process Attendance for Chart (Last 7 days)
        // This is a simplified logic mapping raw records to days
        // In production you would want normalized daily stats from backend
        const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const presentCounts = [0, 0, 0, 0, 0, 0, 0];

        attendance.forEach(r => {
            const d = new Date(r.clockInTime);
            const dayIdx = d.getDay();
            presentCounts[dayIdx]++;
        });

        // Shift data to match labels (Lun-Dom) -> (1-6, 0)
        const chartData = [
            presentCounts[1], presentCounts[2], presentCounts[3],
            presentCounts[4], presentCounts[5], presentCounts[6], presentCounts[0]
        ];

        this.attendanceChartData = {
            labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
            datasets: [
                {
                    label: 'Asistencia Real',
                    data: chartData,
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        };

        // Reviews Distribution
        const distribution = [0, 0, 0, 0]; // [Sobresaliente, Cumple, Mejorable, Bajo]
        reviews.forEach(r => {
            if (r.overallScore >= 90) distribution[0]++;
            else if (r.overallScore >= 70) distribution[1]++;
            else if (r.overallScore >= 50) distribution[2]++;
            else distribution[3]++;
        });

        this.performanceChartData = {
            labels: ['Sobresaliente', 'Cumple', 'Mejorable', 'Bajo'],
            datasets: [
                {
                    data: distribution,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }
            ]
        };

        // Trigger update
        this.attendanceChartData = { ...this.attendanceChartData };
        this.performanceChartData = { ...this.performanceChartData };
    }

    updateChartsDemo() {
        // Fallback Demo Charts
        this.attendanceChartData = {
            labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
            datasets: [
                {
                    label: 'Turnos Programados',
                    data: [12, 12, 12, 12, 14, 8, 4],
                    backgroundColor: 'rgba(139, 92, 246, 0.5)',
                    borderColor: '#8b5cf6',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Asistencia Real',
                    data: [11, 12, 10, 12, 13, 8, 4],
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        };

        this.performanceChartData = {
            labels: ['Sobresaliente', 'Cumple', 'Mejorable', 'Bajo'],
            datasets: [
                {
                    data: [4, 8, 3, 1],
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }
            ]
        };
    }

    updateCharts() {
        // Triggered by filters
        // In a full implementation, this would call loadRealData() with params
        // For now we just refresh to simulate
        this.loadRealData();
    }

    initChartsConfig() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = '#fff';
        const textColorSecondary = '#94a3b8';
        const surfaceBorder = 'rgba(255,255,255,0.1)';

        this.chartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder, drawBorder: false }
                },
                y: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder, drawBorder: false }
                }
            }
        };

        this.doughnutOptions = {
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    labels: { color: textColor }
                }
            }
        };
    }
}
