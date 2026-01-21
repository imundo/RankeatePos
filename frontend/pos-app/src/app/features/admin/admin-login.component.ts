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
    <div class="admin-login-page">
      <div class="login-card">
        <!-- Logo & Title -->
        <div class="header">
          <div class="logo">
            <span class="crown">👑</span>
          </div>
          <h1>SmartPos Admin</h1>
          <p>Panel de control de la plataforma</p>
        </div>

        <!-- Security Badge -->
        <div class="security-badge">
          <span>🛡️</span>
          <span>Área restringida - Solo personal autorizado</span>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="login()" class="login-form">
          <div class="form-group">
            <label>📧 Email</label>
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
                {{ showPassword() ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          @if (error()) {
            <div class="error-message">
              ⚠️ {{ error() }}
            </div>
          }

          <button type="submit" class="btn-login" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
              Verificando...
            } @else {
              🚀 Acceder al Panel
            }
          </button>
        </form>

        <!-- Back Link -->
        <a href="/auth/login" class="back-link">
          ← Volver al login de clientes
        </a>
      </div>

      <!-- Decorative Background -->
      <div class="bg-decoration">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .admin-login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a1a 0%, #12122a 50%, #1a1a3a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      position: relative;
      overflow: hidden;
    }

    /* Background Decoration */
    .bg-decoration {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.3;
    }

    .orb-1 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      top: -100px;
      right: -100px;
      animation: float 6s ease-in-out infinite;
    }

    .orb-2 {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, #10b981, #059669);
      bottom: -50px;
      left: -50px;
      animation: float 8s ease-in-out infinite reverse;
    }

    .orb-3 {
      width: 200px;
      height: 200px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      bottom: 30%;
      right: 10%;
      animation: float 7s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    /* Login Card */
    .login-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 2.5rem;
      backdrop-filter: blur(20px);
      color: white;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      margin-bottom: 1rem;
    }

    .crown {
      font-size: 3rem;
      filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
      background: linear-gradient(90deg, #fff, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header p {
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
      font-size: 0.9rem;
    }

    /* Security Badge */
    .security-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      margin-bottom: 2rem;
      font-size: 0.85rem;
      color: #fca5a5;
    }

    /* Form */
    .login-form {
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
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .form-group input {
      width: 100%;
      padding: 0.875rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: white;
      font-size: 1rem;
      transition: all 0.2s ease;
    }

    .form-group input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .form-group input:focus {
      outline: none;
      border-color: #6366f1;
      background: rgba(99, 102, 241, 0.1);
    }

    .password-wrapper {
      position: relative;
    }

    .password-wrapper input {
      padding-right: 3rem;
    }

    .toggle-password {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
    }

    /* Error */
    .error-message {
      padding: 0.75rem 1rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: #fca5a5;
      font-size: 0.9rem;
    }

    /* Button */
    .btn-login {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 0.5rem;
    }

    .btn-login:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
    }

    .btn-login:disabled {
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

    /* Back Link */
    .back-link {
      display: block;
      text-align: center;
      margin-top: 1.5rem;
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s ease;
    }

    .back-link:hover {
      color: rgba(255, 255, 255, 0.8);
    }

    /* Mobile */
    @media (max-width: 480px) {
      .admin-login-page {
        padding: 1rem;
      }

      .login-card {
        padding: 1.5rem;
        border-radius: 16px;
      }

      h1 {
        font-size: 1.5rem;
      }

      .crown {
        font-size: 2.5rem;
      }
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
