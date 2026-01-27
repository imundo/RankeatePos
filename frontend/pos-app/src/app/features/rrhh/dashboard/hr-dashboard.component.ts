import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { DemoDataService } from '@app/core/services/demo-data.service';

@Component({
    selector: 'app-hr-dashboard',
    standalone: true,
    imports: [CommonModule, ChartModule],
    template: `
    <div class="hr-dashboard min-h-screen bg-[#0f172a] text-white p-6 fade-in">
      
      <!-- Header -->
      <div class="glass-header mb-8 p-6 rounded-3xl flex justify-between items-center relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 z-0"></div>
        <div class="relative z-10">
          <h1 class="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            HR Analytics 
          </h1>
          <p class="text-slate-400 mt-1">Visión estratégica del talento humano</p>
        </div>
        <div class="relative z-10 flex gap-4">
             <div class="glass-pill">
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
                  <h3 class="text-3xl font-bold">{{ kpis.totalStaff }}</h3>
              </div>
              <div class="icon-box bg-blue-500/20 text-blue-300">
                  <i class="pi pi-users text-xl"></i>
              </div>
           </div>
           <div class="mt-4 flex gap-2 text-xs text-slate-400">
              <span class="text-emerald-400 font-bold">95%</span> Activos
           </div>
        </div>

        <!-- Attendance Rate -->
        <div class="glass-card p-6 rounded-3xl relative group">
           <div class="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all"></div>
           <div class="relative z-10 flex justify-between items-start">
              <div>
                  <p class="text-slate-400 text-sm font-medium mb-1">Asistencia Hoy</p>
                  <h3 class="text-3xl font-bold">{{ kpis.attendanceRate }}%</h3>
              </div>
              <div class="icon-box bg-emerald-500/20 text-emerald-300">
                  <i class="pi pi-clock text-xl"></i>
              </div>
           </div>
           <div class="mt-4 flex gap-2 text-xs text-slate-400">
              <span class="text-amber-400 font-bold">{{ kpis.lateArrivals }}</span> Atrasos
           </div>
        </div>

        <!-- Payroll -->
        <div class="glass-card p-6 rounded-3xl relative group">
           <div class="absolute -right-6 -top-6 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl group-hover:bg-violet-500/30 transition-all"></div>
           <div class="relative z-10 flex justify-between items-start">
              <div>
                  <p class="text-slate-400 text-sm font-medium mb-1">Costo Nómina</p>
                  <h3 class="text-3xl font-bold">\${{ kpis.payrollCost | number }}</h3>
              </div>
              <div class="icon-box bg-violet-500/20 text-violet-300">
                  <i class="pi pi-money-bill text-xl"></i>
              </div>
           </div>
           <div class="mt-4 flex gap-2 text-xs text-slate-400">
              Próximo pago: <span class="text-white font-medium">30 ENE</span>
           </div>
        </div>

        <!-- Performance -->
        <div class="glass-card p-6 rounded-3xl relative group">
           <div class="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all"></div>
           <div class="relative z-10 flex justify-between items-start">
              <div>
                  <p class="text-slate-400 text-sm font-medium mb-1">Desempeño Promedio</p>
                  <h3 class="text-3xl font-bold">{{ kpis.avgPerformance }}%</h3>
              </div>
              <div class="icon-box bg-amber-500/20 text-amber-300">
                  <i class="pi pi-star text-xl"></i>
              </div>
           </div>
           <div class="mt-4 w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
               <div class="h-full bg-amber-500 rounded-full" [style.width.%]="kpis.avgPerformance"></div>
           </div>
        </div>

      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        
        <!-- Attendance vs Shifts Chart -->
        <div class="glass-card p-6 rounded-3xl flex flex-col">
           <h3 class="font-bold text-lg mb-6 flex items-center gap-2">
              <span class="w-1 h-6 bg-emerald-500 rounded-full"></span>
              Asistencia vs Turnos (Semana)
           </h3>
           <div class="flex-1 relative w-full h-full min-h-0">
               <p-chart type="bar" [data]="attendanceChartData" [options]="chartOptions" height="100%"></p-chart>
           </div>
        </div>

        <!-- Performance Distribution -->
        <div class="glass-card p-6 rounded-3xl flex flex-col">
            <h3 class="font-bold text-lg mb-6 flex items-center gap-2">
              <span class="w-1 h-6 bg-amber-500 rounded-full"></span>
              Distribución de Desempeño
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
  `]
})
export class HrDashboardComponent implements OnInit {
    private demoData = inject(DemoDataService);

    kpis = {
        totalStaff: 0,
        attendanceRate: 0,
        lateArrivals: 0,
        payrollCost: 0,
        avgPerformance: 0
    };

    attendanceChartData: any;
    performanceChartData: any;

    chartOptions: any;
    doughnutOptions: any;

    ngOnInit() {
        this.initChartsConfig();
        this.loadData();
    }

    loadData() {
        // Simulate loading from demo service for "Wow" effect
        const data = this.demoData.getTenantDemoData('demo').rrhh;

        this.kpis = {
            totalStaff: data?.employees?.length || 12,
            attendanceRate: 92,
            lateArrivals: 3,
            payrollCost: 15420000,
            avgPerformance: 78
        };

        this.updateCharts();
    }

    updateCharts() {
        // Bar Chart: Attendance vs Shifts
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
                    data: [11, 12, 10, 12, 13, 8, 4], // Simulating some absentees
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        };

        // Doughnut: Performance
        this.performanceChartData = {
            labels: ['Sobresaliente', 'Cumple', 'Mejorable', 'Bajo'],
            datasets: [
                {
                    data: [4, 8, 3, 1], // Fake distribution
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                    hoverBackgroundColor: ['#34d399', '#60a5fa', '#fbbf24', '#f87171'],
                    borderWidth: 0
                }
            ]
        };
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
