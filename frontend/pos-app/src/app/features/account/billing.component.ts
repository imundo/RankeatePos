import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Plan {
    code: string;
    name: string;
    price: number;
    features: string[];
    popular?: boolean;
}

interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
}

@Component({
    selector: 'app-billing',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-8">
      <!-- Current Plan Card -->
      <div class="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-8 text-white">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div class="relative">
          <div class="flex items-start justify-between">
            <div>
              <span class="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm mb-4">
                <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Plan Activo
              </span>
              <h2 class="text-4xl font-bold mb-2">Plan {{ currentPlan.name }}</h2>
              <p class="text-indigo-200 mb-6">Renovación: {{ nextBillingDate }}</p>
            </div>
            <div class="text-right">
              <p class="text-indigo-200 text-sm">Precio mensual</p>
              <p class="text-4xl font-bold">\${{ currentPlan.price | number }}</p>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-3 mt-6">
            <button (click)="showPlans = true" 
                    class="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-opacity-90 transition-all shadow-lg">
              🚀 Cambiar Plan
            </button>
            <button class="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl font-semibold hover:bg-white/30 transition-all">
              📋 Ver Detalles
            </button>
          </div>
        </div>
      </div>

      <!-- Plan Selection Modal -->
      <div *ngIf="showPlans" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div *ngFor="let plan of plans" 
             class="relative bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden group hover:shadow-xl"
             [class.border-indigo-500]="plan.code === currentPlan.code"
             [class.border-slate-200]="plan.code !== currentPlan.code"
             [class.shadow-xl]="plan.popular"
             [class.shadow-indigo-500/20]="plan.popular">
          
          <!-- Popular Badge -->
          <div *ngIf="plan.popular" 
               class="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-center py-2 text-sm font-medium">
            ⭐ Más Popular
          </div>
          
          <div class="p-6" [class.pt-12]="plan.popular">
            <h3 class="text-xl font-bold text-slate-800 mb-2">{{ plan.name }}</h3>
            <div class="flex items-baseline gap-1 mb-6">
              <span class="text-4xl font-bold text-slate-900">\${{ plan.price | number }}</span>
              <span class="text-slate-500">/mes</span>
            </div>
            
            <ul class="space-y-3 mb-6">
              <li *ngFor="let feature of plan.features" class="flex items-center gap-2 text-sm text-slate-600">
                <svg class="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                {{ feature }}
              </li>
            </ul>
            
            <button *ngIf="plan.code !== currentPlan.code"
                    (click)="selectPlan(plan)"
                    class="w-full py-3 rounded-xl font-semibold transition-all"
                    [class]="plan.popular ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'">
              Seleccionar Plan
            </button>
            <div *ngIf="plan.code === currentPlan.code" 
                 class="w-full py-3 rounded-xl bg-green-100 text-green-700 font-semibold text-center">
              ✓ Plan Actual
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Method -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 class="font-semibold text-slate-800 flex items-center gap-2">
            <span class="text-xl">💳</span> Método de Pago
          </h2>
          <button class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            + Agregar
          </button>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div class="w-14 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold">
              VISA
            </div>
            <div class="flex-1">
              <p class="font-medium text-slate-800">•••• •••• •••• 4242</p>
              <p class="text-sm text-slate-500">Expira 12/26</p>
            </div>
            <span class="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Principal</span>
          </div>
        </div>
      </div>

      <!-- Invoice History -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 class="font-semibold text-slate-800 flex items-center gap-2">
            <span class="text-xl">📄</span> Historial de Facturas
          </h2>
          <button class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Ver Todas →
          </button>
        </div>
        <div class="divide-y divide-slate-100">
          <div *ngFor="let invoice of invoices" 
               class="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
            <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              📄
            </div>
            <div class="flex-1">
              <p class="font-medium text-slate-800">Factura #{{ invoice.id }}</p>
              <p class="text-sm text-slate-500">{{ invoice.date }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-slate-800">\${{ invoice.amount | number }}</p>
              <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                    [class]="getStatusClass(invoice.status)">
                {{ getStatusLabel(invoice.status) }}
              </span>
            </div>
            <button class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BillingComponent implements OnInit {
    showPlans = false;
    nextBillingDate = '15 Feb 2026';

    currentPlan: Plan = {
        code: 'PRO',
        name: 'Pro',
        price: 45990,
        features: []
    };

    plans: Plan[] = [
        {
            code: 'BASIC',
            name: 'Básico',
            price: 25990,
            features: ['Hasta 5 usuarios', 'POS + Inventario', 'Reportes básicos', 'Soporte email']
        },
        {
            code: 'PRO',
            name: 'Pro',
            price: 45990,
            popular: true,
            features: ['Hasta 15 usuarios', 'Todos los módulos', 'Facturación electrónica', 'Múltiples sucursales', 'Soporte prioritario']
        },
        {
            code: 'ENTERPRISE',
            name: 'Enterprise',
            price: 89990,
            features: ['Usuarios ilimitados', 'API acceso completo', 'Integraciones custom', 'SLA garantizado', 'Soporte 24/7', 'Account Manager']
        }
    ];

    invoices: Invoice[] = [
        { id: 'INV-2026-001', date: '15 Ene 2026', amount: 45990, status: 'paid' },
        { id: 'INV-2025-012', date: '15 Dic 2025', amount: 45990, status: 'paid' },
        { id: 'INV-2025-011', date: '15 Nov 2025', amount: 45990, status: 'paid' }
    ];

    ngOnInit() { }

    selectPlan(plan: Plan) {
        console.log('Selected plan:', plan);
        // API call to change plan
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            'paid': 'bg-green-100 text-green-700',
            'pending': 'bg-amber-100 text-amber-700',
            'failed': 'bg-red-100 text-red-700'
        };
        return classes[status] || 'bg-slate-100 text-slate-700';
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'paid': 'Pagada',
            'pending': 'Pendiente',
            'failed': 'Fallida'
        };
        return labels[status] || status;
    }
}
