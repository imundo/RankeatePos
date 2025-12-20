import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-login-container">
      <div class="admin-login-card">
        <!-- Logo & Title -->
        <div class="admin-header">
          <div class="admin-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h1>SmartPos Admin</h1>
          <p>Acceso exclusivo para administradores de plataforma</p>
        </div>

        <!-- Warning Badge -->
        <div class="security-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>Área restringida - Solo personal autorizado</span>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="login()" class="admin-form">
          <div class="form-group">
            <label>🔐 Email de Administrador</label>
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email"
              placeholder="admin@smartpos.cl"
              required
              autocomplete="username">
          </div>

          <div class="form-group">
            <label>🔑 Contraseña</label>
            <div class="password-wrapper">
              <input 
                [type]="showPassword() ? 'text' : 'password'" 
                [(ngModel)]="password" 
                name="password"
                placeholder="••••••••"
                required
                autocomplete="current-password">
              <button type="button" class="toggle-password" (click)="togglePassword()">
                @if (showPassword()) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                }
              </button>
            </div>
          </div>

          @if (error()) {
            <div class="error-message">
              ⚠️ {{ error() }}
            </div>
          }

          <button type="submit" class="btn-admin-login" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
              Verificando...
            } @else {
              🛡️ Acceder al Panel
            }
          </button>
        </form>

        <!-- Back Link -->
        <a href="/auth/login" class="back-link">
          ← Volver al login de clientes
        </a>
      </div>

      <!-- Security Info -->
      <div class="security-info">
        <h3>🔒 Información de Seguridad</h3>
        <ul>
          <li>Este portal es solo para administradores de SmartPos</li>
          <li>Todos los accesos son registrados y monitoreados</li>
          <li>No comparta sus credenciales con terceros</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .admin-login-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: white;
    }

    .admin-login-card {
      width: 100%;
      max-width: 420px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 24px;
      padding: 2.5rem;
      backdrop-filter: blur(10px);
    }

    .admin-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .admin-logo {
      width: 70px;
      height: 70px;
      margin: 0 auto 1rem;
      background: linear-gradient(135deg, #EF4444, #DC2626);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
    }

    .admin-logo svg {
      width: 40px;
      height: 40px;
      color: white;
    }

    .admin-header h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .admin-header p {
      margin: 0.5rem 0 0;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
    }

    .security-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      margin-bottom: 1.5rem;
      font-size: 0.8rem;
      color: #FCA5A5;
    }

    .security-badge svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .admin-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .form-group input {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: #EF4444;
      background: rgba(239, 68, 68, 0.1);
    }

    .form-group input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .error-message {
      padding: 0.75rem 1rem;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.5);
      border-radius: 10px;
      color: #FCA5A5;
      font-size: 0.9rem;
    }

    .btn-admin-login {
      padding: 1rem;
      background: linear-gradient(135deg, #EF4444, #DC2626);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .btn-admin-login:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
    }

    .btn-admin-login:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .back-link {
      display: block;
      text-align: center;
      margin-top: 1.5rem;
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s;
    }

    .back-link:hover {
      color: white;
    }

    .security-info {
      margin-top: 2rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      max-width: 420px;
    }

    .security-info h3 {
      margin: 0 0 1rem;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .security-info ul {
      margin: 0;
      padding-left: 1.25rem;
      list-style: none;
    }

    .security-info li {
      position: relative;
      padding: 0.25rem 0;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.8rem;
    }

    .security-info li::before {
      content: '•';
      position: absolute;
      left: -1rem;
      color: #EF4444;
    }

    .password-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-wrapper input {
      flex: 1;
      padding-right: 3rem;
    }

    .toggle-password {
      position: absolute;
      right: 0.75rem;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-password svg {
      width: 20px;
      height: 20px;
      color: rgba(255, 255, 255, 0.5);
      transition: color 0.2s;
    }

    .toggle-password:hover svg {
      color: white;
    }
  `]
})
export class AdminLoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  login() {
    if (!this.email || !this.password) {
      this.error.set('Por favor, ingrese email y contraseña');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        // Verify user has SAAS_ADMIN role
        if (!this.authService.hasRole('SAAS_ADMIN')) {
          this.authService.logout();
          this.error.set('Acceso denegado. Solo administradores de plataforma.');
          this.loading.set(false);
          return;
        }

        this.loading.set(false);
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.error.set('Credenciales inválidas');
        } else if (err.status === 403) {
          this.error.set('Acceso denegado');
        } else {
          this.error.set('Error de conexión. Intente nuevamente.');
        }
      }
    });
  }
}
