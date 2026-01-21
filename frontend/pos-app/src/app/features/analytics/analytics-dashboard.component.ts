import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SalesSummary {
    totalVentas: number;
    totalTransacciones: number;
    ticketPromedio: number;
    crecimiento: number;
}

interface TopProduct {
    id: string;
    nombre: string;
    cantidad: number;
    total: number;
}

interface SalesByBranch {
    sucursalId: string;
    sucursalNombre: string;
    ventas: number;
    transacciones: number;
    porcentaje: number;
}

interface HourlySales {
    hora: number;
    ventas: number;
}

@Component({
    selector: 'app-analytics-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <!-- Header -->
      <header class="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/25">
                📊
              </div>
              <div>
                <h1 class="text-2xl font-bold text-white">Analytics</h1>
                <p class="text-slate-400 text-sm">Métricas de rendimiento en tiempo real</p>
              </div>
            </div>
            
            <!-- Date Range Selector -->
            <div class="flex items-center gap-3">
              <div class="flex p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <button *ngFor="let range of dateRanges"
                        (click)="selectedRange = range.id"
                        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        [class]="selectedRange === range.id ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-white'">
                  {{ range.label }}
                </button>
              </div>
              <button class="px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">
                📅 Personalizado
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="max-w-7xl mx-auto px-6 py-8">
        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div *ngFor="let kpi of kpis" 
               class="relative overflow-hidden bg-gradient-to-br rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300"
               [style.background]="kpi.gradient">
            <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div class="relative">
              <p class="text-white/70 text-sm mb-1">{{ kpi.label }}</p>
              <p class="text-3xl font-bold text-white mb-2">{{ kpi.value }}</p>
              <div class="flex items-center gap-1">
                <span class="text-xs px-2 py-0.5 rounded-full"
                      [class]="kpi.change >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'">
                  {{ kpi.change >= 0 ? '↑' : '↓' }} {{ kpi.change | number:'1.1-1' }}%
                </span>
                <span class="text-xs text-white/50">vs periodo anterior</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Sales by Hour -->
          <div class="lg:col-span-2 bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
              <h3 class="font-semibold text-white">Ventas por Hora</h3>
              <span class="text-sm text-slate-400">Hoy</span>
            </div>
            <div class="p-6">
              <div class="flex items-end justify-between h-48 gap-2">
                <div *ngFor="let h of hourlySales" 
                     class="flex-1 flex flex-col items-center">
                  <div class="w-full bg-gradient-to-t from-violet-500 to-violet-400 rounded-t-lg transition-all duration-500 hover:from-violet-400"
                       [style.height.%]="getBarHeight(h.ventas)">
                  </div>
                  <span class="text-xs text-slate-500 mt-2">{{ h.hora }}h</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Products -->
          <div class="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-700/50">
              <h3 class="font-semibold text-white">Top Productos</h3>
            </div>
            <div class="p-4 space-y-3">
              <div *ngFor="let product of topProducts; let i = index" 
                   class="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                     [class]="i === 0 ? 'bg-amber-500 text-amber-900' : i === 1 ? 'bg-slate-400 text-slate-800' : i === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-600 text-slate-300'">
                  {{ i + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-white text-sm font-medium truncate">{{ product.nombre }}</p>
                  <p class="text-slate-400 text-xs">{{ product.cantidad }} vendidos</p>
                </div>
                <p class="text-violet-400 font-semibold">\${{ product.total | number }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Branch Performance -->
        <div class="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden mb-8">
          <div class="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
            <h3 class="font-semibold text-white">Rendimiento por Sucursal</h3>
            <button class="text-sm text-violet-400 hover:text-violet-300">Ver detalle →</button>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div *ngFor="let branch of salesByBranch" class="space-y-2">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-lg">🏢</div>
                    <div>
                      <p class="text-white font-medium">{{ branch.sucursalNombre }}</p>
                      <p class="text-slate-400 text-sm">{{ branch.transacciones }} transacciones</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-white font-semibold">\${{ branch.ventas | number }}</p>
                    <p class="text-violet-400 text-sm">{{ branch.porcentaje | number:'1.1-1' }}%</p>
                  </div>
                </div>
                <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                       [style.width.%]="branch.porcentaje">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button class="flex items-center gap-4 p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:bg-slate-700/50 transition-colors group">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📥</div>
            <div class="text-left">
              <p class="text-white font-medium">Exportar Reporte</p>
              <p class="text-slate-400 text-sm">Excel, PDF, CSV</p>
            </div>
          </button>
          <button class="flex items-center gap-4 p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:bg-slate-700/50 transition-colors group">
            <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📧</div>
            <div class="text-left">
              <p class="text-white font-medium">Programar Envío</p>
              <p class="text-slate-400 text-sm">Reportes automáticos</p>
            </div>
          </button>
          <button class="flex items-center gap-4 p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:bg-slate-700/50 transition-colors group">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">⚙️</div>
            <div class="text-left">
              <p class="text-white font-medium">Configurar Dashboard</p>
              <p class="text-slate-400 text-sm">Personalizar métricas</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  `
})
export class AnalyticsDashboardComponent implements OnInit {
    selectedRange = 'today';

    dateRanges = [
        { id: 'today', label: 'Hoy' },
        { id: 'week', label: 'Semana' },
        { id: 'month', label: 'Mes' },
        { id: 'year', label: 'Año' }
    ];

    kpis = [
        { label: 'Ventas Totales', value: '$2,847,500', change: 12.5, gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
        { label: 'Transacciones', value: '1,234', change: 8.3, gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
        { label: 'Ticket Promedio', value: '$23,075', change: 3.8, gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
        { label: 'Clientes Nuevos', value: '89', change: -2.1, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
    ];

    topProducts: TopProduct[] = [
        { id: '1', nombre: 'Café Latte Grande', cantidad: 156, total: 468000 },
        { id: '2', nombre: 'Sandwich Premium', cantidad: 98, total: 588000 },
        { id: '3', nombre: 'Cheesecake', cantidad: 87, total: 435000 },
        { id: '4', nombre: 'Cappuccino', cantidad: 76, total: 228000 },
        { id: '5', nombre: 'Muffin Chocolate', cantidad: 65, total: 162500 }
    ];

    salesByBranch: SalesByBranch[] = [
        { sucursalId: '1', sucursalNombre: 'Sucursal Centro', ventas: 1250000, transacciones: 542, porcentaje: 44 },
        { sucursalId: '2', sucursalNombre: 'Sucursal Oriente', ventas: 890000, transacciones: 386, porcentaje: 31 },
        { sucursalId: '3', sucursalNombre: 'Sucursal Norte', ventas: 707500, transacciones: 306, porcentaje: 25 }
    ];

    hourlySales: HourlySales[] = [
        { hora: 8, ventas: 15000 },
        { hora: 9, ventas: 45000 },
        { hora: 10, ventas: 78000 },
        { hora: 11, ventas: 95000 },
        { hora: 12, ventas: 120000 },
        { hora: 13, ventas: 135000 },
        { hora: 14, ventas: 98000 },
        { hora: 15, ventas: 67000 },
        { hora: 16, ventas: 89000 },
        { hora: 17, ventas: 112000 },
        { hora: 18, ventas: 145000 },
        { hora: 19, ventas: 130000 },
        { hora: 20, ventas: 95000 },
        { hora: 21, ventas: 55000 }
    ];

    maxSales = 0;

    ngOnInit() {
        this.maxSales = Math.max(...this.hourlySales.map(h => h.ventas));
    }

    getBarHeight(ventas: number): number {
        return (ventas / this.maxSales) * 100;
    }
}
