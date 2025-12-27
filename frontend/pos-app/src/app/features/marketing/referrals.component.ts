import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-referrals',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/dashboard" class="back-btn">←</a>
        <div class="title-section">
          <h1>🤝 Programa de Referidos</h1>
          <p class="subtitle">Crece con recomendaciones de clientes</p>
        </div>
      </header>

      <div class="coming-soon">
        <div class="icon">🎁</div>
        <h2>Próximamente</h2>
        <p>Estamos trabajando en esta funcionalidad</p>
        
        <div class="features-preview">
          <h3>Características incluidas:</h3>
          <ul>
            <li>🔗 Links únicos por cliente</li>
            <li>🎁 Recompensas al referidor y referido</li>
            <li>📊 Tracking de conversiones</li>
            <li>🏆 Leaderboard de top referidores</li>
            <li>📱 Sharing a WhatsApp y redes sociales</li>
            <li>💰 Comisiones automáticas</li>
          </ul>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: white;
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .back-btn {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none; color: white; font-size: 1.25rem;
    }

    .title-section h1 { margin: 0; font-size: 1.5rem; }
    .subtitle { color: rgba(255, 255, 255, 0.6); margin: 0.25rem 0 0; }

    .coming-soon {
      text-align: center;
      padding: 4rem 2rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      max-width: 500px;
      margin: 2rem auto;
    }

    .icon { font-size: 4rem; margin-bottom: 1rem; }
    .coming-soon h2 { margin: 0 0 0.5rem; font-size: 1.75rem; }
    .coming-soon > p { color: rgba(255, 255, 255, 0.5); margin-bottom: 2rem; }

    .features-preview {
      text-align: left;
      background: rgba(6, 182, 212, 0.1);
      border-radius: 16px;
      padding: 1.5rem;
    }

    .features-preview h3 { 
      margin: 0 0 1rem; 
      font-size: 0.9rem;
      color: #22d3ee;
    }

    .features-preview ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .features-preview li {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.8);
    }
  `]
})
export class ReferralsComponent { }
