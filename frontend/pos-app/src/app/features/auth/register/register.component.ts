import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AuthService } from '@core/auth/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        DropdownModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
    <div class="auth-container">
      <div class="auth-card card card-elevated">
        <div class="auth-header">
          <h1>🏪 Crear cuenta</h1>
          <p class="text-muted">Registra tu negocio</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <!-- Datos Empresa -->
          <h3 class="section-title">Datos de la empresa</h3>
          
          <div class="input-group">
            <label class="input-label">RUT Empresa *</label>
            <input 
              type="text" 
              pInputText
              [(ngModel)]="form.rut"
              name="rut"
              required
              placeholder="12.345.678-9"
              [disabled]="loading()"
            />
          </div>
          
          <div class="input-group">
            <label class="input-label">Razón Social *</label>
            <input 
              type="text" 
              pInputText
              [(ngModel)]="form.razonSocial"
              name="razonSocial"
              required
              placeholder="Mi Empresa SpA"
              [disabled]="loading()"
            />
          </div>
          
          <div class="input-group">
            <label class="input-label">Nombre de Fantasía</label>
            <input 
              type="text" 
              pInputText
              [(ngModel)]="form.nombreFantasia"
              name="nombreFantasia"
              placeholder="Mi Negocio"
              [disabled]="loading()"
            />
          </div>
          
          <div class="input-group">
            <label class="input-label">Tipo de negocio *</label>
            <p-dropdown 
              [(ngModel)]="form.businessType"
              name="businessType"
              [options]="businessTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona tu rubro"
              [disabled]="loading()"
              styleClass="w-full"
            ></p-dropdown>
          </div>
          
          <!-- Datos Usuario -->
          <h3 class="section-title mt-3">Datos del administrador</h3>
          
          <div class="input-group">
            <label class="input-label">Nombre *</label>
            <input 
              type="text" 
              pInputText
              [(ngModel)]="form.nombre"
              name="nombre"
              required
              placeholder="Juan"
              [disabled]="loading()"
            />
          </div>
          
          <div class="input-group">
            <label class="input-label">Email *</label>
            <input 
              type="email" 
              pInputText
              [(ngModel)]="form.email"
              name="email"
              required
              email
              placeholder="tu@email.com"
              [disabled]="loading()"
            />
          </div>
          
          <div class="input-group">
            <label class="input-label">Contraseña *</label>
            <p-password 
              [(ngModel)]="form.password"
              name="password"
              required
              minlength="8"
              [toggleMask]="true"
              placeholder="Mínimo 8 caracteres"
              [disabled]="loading()"
              styleClass="w-full"
            ></p-password>
          </div>
          
          <button 
            type="submit"
            class="btn btn-primary btn-lg btn-block mt-3"
            [disabled]="!registerForm.valid || loading()"
          >
            @if (loading()) {
              <span class="spinner" style="width: 20px; height: 20px;"></span>
              Creando cuenta...
            } @else {
              <i class="pi pi-user-plus"></i>
              Crear cuenta
            }
          </button>
        </form>
        
        <div class="auth-footer">
          <p>¿Ya tienes cuenta? <a routerLink="/auth/login">Inicia sesión</a></p>
        </div>
      </div>
    </div>
    
    <p-toast position="top-center"></p-toast>
  `,
    styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
    }
    
    .auth-card {
      width: 100%;
      max-width: 450px;
      padding: 2rem;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .auth-header {
      text-align: center;
      margin-bottom: 1.5rem;
      
      h1 {
        font-size: 1.75rem;
        margin-bottom: 0.5rem;
      }
    }
    
    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--surface-border);
    }
    
    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--surface-border);
    }
    
    :host ::ng-deep .p-password,
    :host ::ng-deep .p-dropdown {
      width: 100%;
      
      .p-inputtext {
        width: 100%;
      }
    }
  `]
})
export class RegisterComponent {
    private authService = inject(AuthService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    form = {
        rut: '',
        razonSocial: '',
        nombreFantasia: '',
        businessType: 'MINIMARKET',
        nombre: '',
        email: '',
        password: ''
    };

    businessTypes = [
        { label: 'Panadería', value: 'PANADERIA' },
        { label: 'Charcutería', value: 'CHARCUTERIA' },
        { label: 'Minimarket', value: 'MINIMARKET' },
        { label: 'Verdulería', value: 'VERDULERIA' },
        { label: 'Ferretería', value: 'FERRETERIA' },
        { label: 'Librería', value: 'LIBRERIA' },
        { label: 'Farmacia', value: 'FARMACIA' },
        { label: 'Otro', value: 'OTRO' }
    ];

    loading = signal(false);

    onSubmit(): void {
        this.loading.set(true);

        this.authService.register(this.form)
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: '¡Bienvenido!',
                        detail: 'Tu cuenta ha sido creada',
                        life: 3000
                    });

                    setTimeout(() => {
                        this.router.navigate(['/pos']);
                    }, 1000);
                },
                error: (err) => {
                    this.loading.set(false);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.displayMessage || 'No se pudo crear la cuenta',
                        life: 5000
                    });
                }
            });
    }
}
