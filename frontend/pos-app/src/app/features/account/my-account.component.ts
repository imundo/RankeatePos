import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { BillingComponent } from './billing.component';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BillingComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <!-- Animated Header -->
      <header class="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNC0yIDQtMiA0LTItMi0yLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div class="relative max-w-6xl mx-auto px-6 py-12">
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-xl">
              {{ getInitials() }}
            </div>
            <div>
              <h1 class="text-3xl font-bold">{{ tenantName || 'Mi Negocio' }}</h1>
              <p class="text-indigo-200 mt-1">Configuración de cuenta</p>
            </div>
          </div>
        </div>
        <!-- Decorative wave -->
        <div class="absolute bottom-0 left-0 right-0">
          <svg class="w-full h-6 text-slate-50" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
          </svg>
        </div>
      </header>

      <main class="max-w-6xl mx-auto px-6 py-8 -mt-4">
        <!-- Tabs Navigation -->
        <div class="flex gap-2 mb-8 p-1 bg-white rounded-2xl shadow-sm border border-slate-200/50">
          <button *ngFor="let tab of tabs" 
                  (click)="activeTab = tab.id"
                  class="flex-1 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300"
                  [class]="activeTab === tab.id ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 hover:bg-slate-50'">
            <span class="mr-2">{{ tab.icon }}</span>{{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="space-y-6" [ngSwitch]="activeTab">
          
          <!-- Profile Tab -->
          <div *ngSwitchCase="'profile'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Main Form -->
            <div class="lg:col-span-2 space-y-6">
              <div class="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h2 class="font-semibold text-slate-800 flex items-center gap-2">
                    <span class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">🏢</span>
                    Información del Negocio
                  </h2>
                </div>
                <div class="p-6 space-y-5">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">RUT Empresa</label>
                      <input type="text" [(ngModel)]="profile.rut" 
                             class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all bg-slate-50/50"
                             placeholder="12.345.678-9">
                    </div>
                    <div class="col-span-2 sm:col-span-1">
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Razón Social</label>
                      <input type="text" [(ngModel)]="profile.razonSocial" 
                             class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                             placeholder="Mi Empresa SpA">
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Nombre Comercial</label>
                    <input type="text" [(ngModel)]="profile.nombreFantasia" 
                           class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                           placeholder="Mi Tienda">
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Email Contacto</label>
                      <input type="email" [(ngModel)]="profile.email" 
                             class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                             placeholder="contacto@miempresa.cl">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                      <input type="tel" [(ngModel)]="profile.telefono" 
                             class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                             placeholder="+56 9 1234 5678">
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
                    <input type="text" [(ngModel)]="profile.direccion" 
                           class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                           placeholder="Av. Principal 123, Santiago">
                  </div>
                </div>
                <div class="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                  <button (click)="saveProfile()" 
                          [disabled]="saving"
                          class="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50">
                    {{ saving ? 'Guardando...' : '💾 Guardar Cambios' }}
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Logo Upload -->
            <div class="space-y-6">
              <div class="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100">
                  <h2 class="font-semibold text-slate-800">Logo del Negocio</h2>
                </div>
                <div class="p-6">
                  <div class="aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group">
                    <div class="w-16 h-16 rounded-2xl bg-slate-200 group-hover:bg-indigo-200 flex items-center justify-center text-3xl mb-3 transition-colors">
                      📷
                    </div>
                    <p class="text-sm text-slate-500 group-hover:text-indigo-600 transition-colors">Arrastra o haz clic</p>
                    <p class="text-xs text-slate-400 mt-1">PNG, JPG hasta 2MB</p>
                  </div>
                </div>
              </div>
              
              <!-- Quick Stats -->
              <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                <h3 class="font-semibold mb-4">📊 Resumen</h3>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-indigo-200">Plan Actual</span>
                    <span class="font-bold">{{ profile.plan || 'PRO' }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-indigo-200">Usuarios</span>
                    <span class="font-bold">5 / 10</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-indigo-200">Sucursales</span>
                    <span class="font-bold">2 / 5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Billing Tab -->
          <div *ngSwitchCase="'billing'">
            <app-billing></app-billing>
          </div>

          <!-- Security Tab -->
          <div *ngSwitchCase="'security'" class="max-w-2xl">
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
              <div class="px-6 py-4 border-b border-slate-100">
                <h2 class="font-semibold text-slate-800 flex items-center gap-2">
                  <span class="text-xl">🔐</span> Seguridad
                </h2>
              </div>
              <div class="p-6 space-y-6">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Contraseña Actual</label>
                  <input type="password" [(ngModel)]="passwordForm.current"
                         class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Nueva Contraseña</label>
                    <input type="password" [(ngModel)]="passwordForm.new"
                           class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1.5">Confirmar</label>
                    <input type="password" [(ngModel)]="passwordForm.confirm"
                           class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
                  </div>
                </div>
                <button class="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25">
                  Actualizar Contraseña
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class MyAccountComponent implements OnInit {
  private authService = inject(AuthService);

  tabs = [
    { id: 'profile', label: 'Perfil', icon: '🏢' },
    { id: 'billing', label: 'Facturación', icon: '💳' },
    { id: 'security', label: 'Seguridad', icon: '🔐' }
  ];

  activeTab = 'profile';
  tenantName = '';
  saving = false;

  profile = {
    rut: '',
    razonSocial: '',
    nombreFantasia: '',
    email: '',
    telefono: '',
    direccion: '',
    plan: 'PRO'
  };

  passwordForm = {
    current: '',
    new: '',
    confirm: ''
  };

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    const currentUser = (this.authService as any).userValue;
    if (currentUser) {
      this.tenantName = currentUser.tenantName || 'Mi Negocio';
      // Load profile from API in production
    }
  }

  getInitials(): string {
    return this.tenantName.substring(0, 2).toUpperCase() || 'MN';
  }

  saveProfile() {
    this.saving = true;
    // API call would go here
    setTimeout(() => {
      this.saving = false;
      console.log('Profile saved', this.profile);
    }, 1000);
  }
}
