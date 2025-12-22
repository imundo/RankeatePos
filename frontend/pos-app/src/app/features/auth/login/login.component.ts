import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="login-container">
      <!-- Background with progressive images -->
      <div class="background-slideshow">
        @for (img of backgroundImages; track img.id; let i = $index) {
          <div 
            class="slide" 
            [class.active]="currentSlide === i"
            [style.background-image]="'url(' + img.url + ')'">
          </div>
        }
        <div class="overlay"></div>
      </div>

      <!-- Login Card -->
      <div class="login-wrapper">
        <div class="login-card">
          <!-- Logo and Branding -->
          <div class="branding">
            <div class="logo-container">
              <svg class="logo-icon" viewBox="0 0 48 48" fill="none">
                <!-- Smart brain/rocket hybrid icon -->
                <circle cx="24" cy="24" r="20" fill="url(#smartGradient)"/>
                <path d="M24 12c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm0 2c5.5 0 10 4.5 10 10s-4.5 10-10 10-10-4.5-10-10 4.5-10 10-10z" fill="white" opacity="0.3"/>
                <path d="M24 16l-6 12h4v8l6-12h-4z" fill="white"/>
                <circle cx="24" cy="18" r="2" fill="#10B981"/>
                <circle cx="18" cy="24" r="1.5" fill="#F59E0B"/>
                <circle cx="30" cy="24" r="1.5" fill="#F59E0B"/>
                <defs>
                  <linearGradient id="smartGradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#3B82F6"/>
                    <stop offset="0.5" stop-color="#8B5CF6"/>
                    <stop offset="1" stop-color="#EC4899"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="app-name">SmartPos</h1>
            <p class="app-tagline">Inteligencia para tu negocio</p>
          </div>

          <!-- Business Type Indicator -->
          <div class="business-badges">
            <span class="badge">🚀 +500 negocios</span>
            <span class="badge">⭐ 4.9 estrellas</span>
            <span class="badge">🔥 Gratis 14 días</span>
          </div>

          <!-- Login Form -->
          <form (ngSubmit)="onSubmit()" class="login-form">
            <div class="form-group">
              <label for="email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Correo electrónico
              </label>
              <input 
                type="email" 
                id="email"
                [(ngModel)]="email" 
                name="email"
                placeholder="tu@email.com"
                [disabled]="loading()"
                autocomplete="email"
                required>
            </div>
            
            <div class="form-group">
              <label for="password">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Contraseña
              </label>
              <div class="password-wrapper">
                <input 
                  [type]="showPassword ? 'text' : 'password'"
                  id="password"
                  [(ngModel)]="password" 
                  name="password"
                  placeholder="••••••••"
                  [disabled]="loading()"
                  autocomplete="current-password"
                  required>
                <button 
                  type="button" 
                  class="password-toggle"
                  (click)="showPassword = !showPassword"
                  [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <svg *ngIf="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg *ngIf="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              class="btn-login"
              [disabled]="loading() || !email || !password">
              @if (loading()) {
                <span class="spinner"></span>
                Ingresando...
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Iniciar Sesión
              }
            </button>
          </form>

          <!-- Demo Credentials -->
          <div class="demo-section">
            <div class="demo-divider">
              <span>Demos por industria</span>
            </div>
            <div class="demo-cards five-cols">
              <button class="demo-card" (click)="fillDemo('admin@eltrigal.cl', 'demo1234')">
                <span class="demo-icon">🥖</span>
                <span class="demo-name">Panadería El Trigal</span>
                <span class="demo-email">admin&#64;eltrigal.cl</span>
              </button>
              <button class="demo-card" (click)="fillDemo('admin@aprende.cl', 'demo1234')">
                <span class="demo-icon">🎓</span>
                <span class="demo-name">Academia Pro</span>
                <span class="demo-email">admin&#64;aprende.cl</span>
              </button>
              <button class="demo-card" (click)="fillDemo('admin@imprenta.cl', 'demo1234')">
                <span class="demo-icon">📚</span>
                <span class="demo-name">Editorial Creativa</span>
                <span class="demo-email">admin&#64;imprenta.cl</span>
              </button>
              <button class="demo-card" (click)="fillDemo('admin@donpedro.cl', 'demo1234')">
                <span class="demo-icon">🛒</span>
                <span class="demo-name">Minimarket</span>
                <span class="demo-email">admin&#64;donpedro.cl</span>
              </button>
              <button class="demo-card" (click)="fillDemo('admin@laselecta.cl', 'demo1234')">
                <span class="demo-icon">🧀</span>
                <span class="demo-name">Charcutería La Selecta</span>
                <span class="demo-email">admin&#64;laselecta.cl</span>
              </button>
            </div>

          </div>

          <!-- Footer -->
          <div class="login-footer">
            <p>¿No tienes cuenta? <a routerLink="/auth/register">Regístrate gratis</a></p>
          </div>
        </div>

        <!-- Features Showcase -->
        <div class="features-panel">
          <h2>🚀 Transforma tu negocio</h2>
          <p class="features-subtitle">La plataforma #1 en punto de venta inteligente</p>
          <ul class="features-list">
            <li>
              <span class="feature-icon">💰</span>
              <div>
                <strong>Vende 3x más rápido</strong>
                <span>Interfaz intuitiva que reduce errores y acelera cada transacción</span>
              </div>
            </li>
            <li>
              <span class="feature-icon">📈</span>
              <div>
                <strong>Decisiones con datos reales</strong>
                <span>Reportes y analytics que revelan oportunidades de crecimiento</span>
              </div>
            </li>
            <li>
              <span class="feature-icon">🌐</span>
              <div>
                <strong>Nunca pierdas una venta</strong>
                <span>Modo offline inteligente - vende sin internet, sincroniza después</span>
              </div>
            </li>
            <li>
              <span class="feature-icon">🛡️</span>
              <div>
                <strong>Tu negocio protegido 24/7</strong>
                <span>Encriptación bancaria y backups automáticos en la nube</span>
              </div>
            </li>
            <li>
              <span class="feature-icon">🎯</span>
              <div>
                <strong>Multi-industria</strong>
                <span>Retail, servicios, cursos, editorial - adaptado a tu negocio</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Slide indicators -->
      <div class="slide-indicators">
        @for (img of backgroundImages; track img.id; let i = $index) {
          <button 
            class="indicator" 
            [class.active]="currentSlide === i"
            (click)="goToSlide(i)">
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 1rem;
    }

    /* Background Slideshow */
    .background-slideshow {
      position: absolute;
      inset: 0;
      z-index: 0;
    }

    .slide {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0;
      transition: opacity 1.5s ease-in-out;
      transform: scale(1.1);
    }

    .slide.active {
      opacity: 1;
      transform: scale(1);
      animation: zoomIn 8s ease-out forwards;
    }

    @keyframes zoomIn {
      from { transform: scale(1); }
      to { transform: scale(1.1); }
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(15, 23, 42, 0.85) 0%,
        rgba(30, 41, 59, 0.75) 50%,
        rgba(15, 23, 42, 0.9) 100%
      );
      backdrop-filter: blur(2px);
    }

    /* Login Wrapper */
    .login-wrapper {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      max-width: 1000px;
      width: 100%;
      z-index: 1;
    }

    @media (max-width: 900px) {
      .login-wrapper {
        grid-template-columns: 1fr;
        max-width: 450px;
      }
      .features-panel {
        display: none;
      }
    }

    /* Login Card */
    .login-card {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
    }

    /* Branding */
    .branding {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .logo-container {
      width: 72px;
      height: 72px;
      margin: 0 auto 1rem;
      background: rgba(99, 102, 241, 0.15);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(99, 102, 241, 0.3);
    }

    .logo-icon {
      width: 48px;
      height: 48px;
    }

    .app-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
      margin: 0;
      background: linear-gradient(135deg, #fff 0%, #c7d2fe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .app-tagline {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.875rem;
      margin: 0.25rem 0 0;
    }

    /* Business Badges */
    .business-badges {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .badge {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    .form-group label svg {
      width: 16px;
      height: 16px;
      opacity: 0.7;
    }

    .form-group input {
      width: 100%;
      padding: 0.875rem 1rem;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.06);
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: white;
      transition: all 0.3s ease;
    }

    .form-group input::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }

    .form-group input:focus {
      outline: none;
      border-color: #6366F1;
      background: rgba(99, 102, 241, 0.1);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
    }

    .password-wrapper {
      position: relative;
    }

    .password-wrapper input {
      padding-right: 3rem;
    }

    .password-toggle {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.5);
      transition: color 0.2s;
    }

    .password-toggle:hover {
      color: white;
    }

    .password-toggle svg {
      width: 20px;
      height: 20px;
    }

    /* Login Button */
    .btn-login {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 1rem;
      font-size: 1rem;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    }

    .btn-login:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
    }

    .btn-login:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn-login svg {
      width: 20px;
      height: 20px;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Demo Section */
    .demo-section {
      margin-top: 1.5rem;
    }

    .demo-divider {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .demo-divider::before,
    .demo-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
    }

    .demo-divider span {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .demo-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      
      &.four-cols {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
      }
      
      &.five-cols {
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
        
        @media (max-width: 400px) {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    }

    .demo-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      padding: 0.6rem 0.4rem;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .demo-card:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.3);
      transform: translateY(-2px);
    }

    .demo-icon {
      font-size: 1.25rem;
    }

    .demo-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }

    .demo-email {
      font-size: 0.65rem;
      color: rgba(255, 255, 255, 0.5);
    }

    /* Footer */
    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .login-footer p {
      margin: 0;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.5);
    }

    .login-footer a {
      color: #818CF8;
      text-decoration: none;
      font-weight: 500;
    }

    .login-footer a:hover {
      text-decoration: underline;
    }

    /* Features Panel */
    .features-panel {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 2rem;
    }

    .features-panel h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
      margin: 0 0 0.5rem;
    }

    .features-subtitle {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.6);
      margin: 0 0 2rem;
      font-weight: 400;
    }

    .features-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .features-list li {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .feature-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .features-list li div {
      display: flex;
      flex-direction: column;
    }

    .features-list li strong {
      color: white;
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }

    .features-list li span {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
    }

    /* Slide Indicators */
    .slide-indicators {
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
      z-index: 2;
    }

    .indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .indicator.active {
      width: 24px;
      border-radius: 4px;
      background: white;
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  email = '';
  password = '';
  showPassword = false;
  loading = signal(false);
  currentSlide = 0;
  private slideInterval: any;

  // Background images representing business types
  backgroundImages = [
    { id: 1, url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&q=80' }, // Bakery
    { id: 2, url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1920&q=80' }, // Bread
    { id: 3, url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80' }, // POS
    { id: 4, url: 'https://images.unsplash.com/photo-1604908177520-80d0d3f0adb0?w=1920&q=80' }, // Store
  ];

  ngOnInit() {
    this.startSlideshow();
  }

  ngOnDestroy() {
    this.stopSlideshow();
  }

  startSlideshow() {
    this.slideInterval = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.backgroundImages.length;
    }, 6000);
  }

  stopSlideshow() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    this.stopSlideshow();
    this.startSlideshow();
  }

  fillDemo(email: string, password: string): void {
    this.email = email;
    this.password = password;
  }

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.loading.set(true);

    this.authService.login({ email: this.email, password: this.password })
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/pos';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error de acceso',
            detail: err.displayMessage || 'Credenciales inválidas',
            life: 5000
          });
        }
      });
  }
}
