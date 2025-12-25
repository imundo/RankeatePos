import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

interface WhatsAppTemplate {
    id: string;
    nombre: string;
    tipo: 'pedido' | 'promo' | 'recordatorio' | 'confirmacion';
    mensaje: string;
    variables: string[];
    activo: boolean;
}

interface WhatsAppMessage {
    id: string;
    destinatario: string;
    nombreCliente: string;
    template: string;
    estado: 'enviado' | 'entregado' | 'leido' | 'fallido';
    fecha: Date;
    respuesta?: string;
}

interface WhatsAppConfig {
    numeroWhatsApp: string;
    apiKey: string;
    webhookUrl: string;
    activo: boolean;
    horariosEnvio: {
        inicio: string;
        fin: string;
    };
}

@Component({
    selector: 'app-whatsapp',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="whatsapp-container">
      <!-- Header -->
      <header class="wa-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-btn">←</a>
          <div class="title-section">
            <h1>💬 WhatsApp Business</h1>
            <p class="subtitle">Notificaciones y pedidos por WhatsApp</p>
          </div>
        </div>
        <div class="header-status" [class.active]="config().activo">
          <span class="status-dot"></span>
          {{ config().activo ? 'Conectado' : 'Desconectado' }}
        </div>
      </header>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card gradient-green">
          <div class="stat-icon">📤</div>
          <div class="stat-content">
            <span class="stat-value">{{ mensajesEnviados() }}</span>
            <span class="stat-label">Mensajes Hoy</span>
          </div>
        </div>
        <div class="stat-card gradient-blue">
          <div class="stat-icon">👁️</div>
          <div class="stat-content">
            <span class="stat-value">{{ tasaLectura() }}%</span>
            <span class="stat-label">Tasa de Lectura</span>
          </div>
        </div>
        <div class="stat-card gradient-purple">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <span class="stat-value">{{ pedidosWhatsApp() }}</span>
            <span class="stat-label">Pedidos vía WA</span>
          </div>
        </div>
        <div class="stat-card gradient-amber">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <span class="stat-value">{{ formatPrice(ventasWhatsApp()) }}</span>
            <span class="stat-label">Ventas por WA</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active]="activeTab === 'messages'" (click)="activeTab = 'messages'">
          📨 Mensajes
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'templates'" (click)="activeTab = 'templates'">
          📋 Plantillas
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'campaigns'" (click)="activeTab = 'campaigns'">
          📢 Campañas
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'settings'" (click)="activeTab = 'settings'">
          ⚙️ Configuración
        </button>
      </div>

      <!-- Messages Tab -->
      @if (activeTab === 'messages') {
        <div class="messages-section">
          <div class="messages-header">
            <input type="text" placeholder="🔍 Buscar mensajes..." class="search-input" [(ngModel)]="searchQuery">
            <button class="new-msg-btn" (click)="showNewMessage = true">
              ➕ Nuevo Mensaje
            </button>
          </div>

          <div class="messages-list">
            @for (msg of filteredMessages(); track msg.id) {
              <div class="message-card" [class]="msg.estado">
                <div class="msg-avatar">
                  {{ msg.nombreCliente.charAt(0) }}
                </div>
                <div class="msg-content">
                  <div class="msg-header">
                    <span class="msg-name">{{ msg.nombreCliente }}</span>
                    <span class="msg-phone">{{ msg.destinatario }}</span>
                  </div>
                  <p class="msg-text">{{ getTemplatePreview(msg.template) }}</p>
                  @if (msg.respuesta) {
                    <div class="msg-response">
                      <span class="response-label">Respuesta:</span>
                      {{ msg.respuesta }}
                    </div>
                  }
                </div>
                <div class="msg-meta">
                  <span class="msg-status" [class]="msg.estado">
                    {{ getStatusIcon(msg.estado) }} {{ getStatusLabel(msg.estado) }}
                  </span>
                  <span class="msg-time">{{ formatTime(msg.fecha) }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Templates Tab -->
      @if (activeTab === 'templates') {
        <div class="templates-section">
          <div class="templates-header">
            <h2>Plantillas de Mensajes</h2>
            <button class="add-template-btn" (click)="showNewTemplate = true">
              ➕ Nueva Plantilla
            </button>
          </div>

          <div class="templates-grid">
            @for (template of templates(); track template.id) {
              <div class="template-card" [class.inactive]="!template.activo">
                <div class="template-header">
                  <span class="template-icon">{{ getTemplateIcon(template.tipo) }}</span>
                  <div>
                    <h3>{{ template.nombre }}</h3>
                    <span class="template-tipo">{{ getTemplateTypeLabel(template.tipo) }}</span>
                  </div>
                </div>
                <div class="template-preview">
                  <p>{{ template.mensaje }}</p>
                </div>
                <div class="template-vars">
                  @for (variable of template.variables; track variable) {
                    <span class="var-badge">{{ '{{' + variable + '}}' }}</span>
                  }
                </div>
                <div class="template-actions">
                  <button class="template-btn" (click)="toggleTemplate(template)">
                    {{ template.activo ? '🟢' : '🔴' }}
                  </button>
                  <button class="template-btn" (click)="editTemplate(template)">✏️</button>
                  <button class="template-btn test" (click)="testTemplate(template)">📤 Probar</button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Campaigns Tab -->
      @if (activeTab === 'campaigns') {
        <div class="campaigns-section">
          <div class="campaigns-header">
            <h2>Campañas de WhatsApp</h2>
            <button class="new-campaign-btn">➕ Nueva Campaña</button>
          </div>

          <div class="campaigns-list">
            @for (campaign of campaigns(); track campaign.nombre) {
              <div class="campaign-card" [class]="campaign.estado">
                <div class="campaign-info">
                  <h3>{{ campaign.nombre }}</h3>
                  <p>{{ campaign.descripcion }}</p>
                </div>
                <div class="campaign-stats">
                  <div class="c-stat">
                    <span class="value">{{ campaign.enviados }}</span>
                    <span class="label">Enviados</span>
                  </div>
                  <div class="c-stat">
                    <span class="value">{{ campaign.entregados }}</span>
                    <span class="label">Entregados</span>
                  </div>
                  <div class="c-stat">
                    <span class="value">{{ campaign.leidos }}</span>
                    <span class="label">Leídos</span>
                  </div>
                  <div class="c-stat">
                    <span class="value">{{ campaign.conversiones }}</span>
                    <span class="label">Conversiones</span>
                  </div>
                </div>
                <div class="campaign-status">
                  <span class="status-badge" [class]="campaign.estado">
                    {{ getCampaignStatusLabel(campaign.estado) }}
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Settings Tab -->
      @if (activeTab === 'settings') {
        <div class="settings-section">
          <h2>⚙️ Configuración de WhatsApp</h2>

          <div class="settings-card">
            <div class="setting-group">
              <label>Número de WhatsApp Business</label>
              <input type="tel" [(ngModel)]="config().numeroWhatsApp" placeholder="+56 9 1234 5678">
            </div>

            <div class="setting-group">
              <label>API Key (Meta Business)</label>
              <input type="password" [(ngModel)]="config().apiKey" placeholder="••••••••••••">
            </div>

            <div class="setting-group">
              <label>Webhook URL</label>
              <input type="url" [value]="config().webhookUrl" readonly>
              <button class="copy-btn" (click)="copyWebhook()">📋 Copiar</button>
            </div>

            <div class="setting-group">
              <label>Horario de Envío</label>
              <div class="time-range">
                <input type="time" [(ngModel)]="config().horariosEnvio.inicio">
                <span>a</span>
                <input type="time" [(ngModel)]="config().horariosEnvio.fin">
              </div>
            </div>

            <div class="setting-group toggle-group">
              <span>Activar Notificaciones WhatsApp</span>
              <button class="toggle-btn" [class.active]="config().activo" (click)="toggleConfig()">
                <span class="toggle-slider"></span>
              </button>
            </div>

            <button class="save-settings-btn">💾 Guardar Configuración</button>
          </div>

          <div class="auto-messages-section">
            <h3>📬 Mensajes Automáticos</h3>
            <div class="auto-msg-list">
              <div class="auto-msg-item">
                <span class="label">✅ Confirmación de Pedido</span>
                <button class="toggle-sm active">Activo</button>
              </div>
              <div class="auto-msg-item">
                <span class="label">🚚 Pedido en Camino</span>
                <button class="toggle-sm active">Activo</button>
              </div>
              <div class="auto-msg-item">
                <span class="label">📦 Pedido Entregado</span>
                <button class="toggle-sm active">Activo</button>
              </div>
              <div class="auto-msg-item">
                <span class="label">🎂 Mensaje de Cumpleaños</span>
                <button class="toggle-sm">Inactivo</button>
              </div>
              <div class="auto-msg-item">
                <span class="label">⏰ Recordatorio de Reorden</span>
                <button class="toggle-sm">Inactivo</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .whatsapp-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: white;
      padding: 1.5rem;
    }

    /* Header */
    .wa-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-left { display: flex; align-items: center; gap: 1rem; }

    .back-btn {
      width: 48px; height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none; color: white; font-size: 1.5rem;
    }

    .title-section h1 { margin: 0; font-size: 1.75rem; }
    .subtitle { color: rgba(255, 255, 255, 0.6); margin: 0.25rem 0 0; }

    .header-status {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 30px;
      background: rgba(255, 255, 255, 0.1);
    }

    .status-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #EF4444;
    }

    .header-status.active .status-dot {
      background: #10B981;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      padding: 1.5rem; border-radius: 16px;
      display: flex; align-items: center; gap: 1rem;
    }

    .gradient-green { background: linear-gradient(135deg, #25D366, #128C7E); }
    .gradient-blue { background: linear-gradient(135deg, #3B82F6, #0EA5E9); }
    .gradient-purple { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
    .gradient-amber { background: linear-gradient(135deg, #F59E0B, #FBBF24); }

    .stat-icon { font-size: 2.5rem; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.75rem; font-weight: 800; }
    .stat-label { font-size: 0.875rem; opacity: 0.9; }

    /* Tabs */
    .tabs-container {
      display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.5rem; border-radius: 12px;
      overflow-x: auto;
    }

    .tab-btn {
      padding: 0.75rem 1.5rem;
      border: none; background: transparent;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 600; cursor: pointer; border-radius: 8px;
      white-space: nowrap;
    }

    .tab-btn.active { background: linear-gradient(135deg, #25D366, #128C7E); color: white; }

    /* Messages */
    .messages-header {
      display: flex; gap: 1rem; margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1; min-width: 200px;
      padding: 0.75rem 1rem; border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.05);
      color: white; font-size: 1rem;
    }

    .new-msg-btn {
      padding: 0.75rem 1.5rem; border-radius: 12px;
      border: none; background: linear-gradient(135deg, #25D366, #128C7E);
      color: white; font-weight: 600; cursor: pointer;
    }

    .messages-list { display: flex; flex-direction: column; gap: 1rem; }

    .message-card {
      display: flex; gap: 1rem; padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px; align-items: flex-start;
    }

    .msg-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, #25D366, #128C7E);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.25rem; flex-shrink: 0;
    }

    .msg-content { flex: 1; }
    .msg-header { display: flex; gap: 1rem; align-items: baseline; }
    .msg-name { font-weight: 600; }
    .msg-phone { color: rgba(255, 255, 255, 0.5); font-size: 0.875rem; }
    .msg-text { margin: 0.5rem 0; color: rgba(255, 255, 255, 0.8); }

    .msg-response {
      margin-top: 0.5rem; padding: 0.5rem;
      background: rgba(37, 211, 102, 0.1);
      border-radius: 8px; font-size: 0.875rem;
    }

    .response-label { color: #25D366; font-weight: 500; }

    .msg-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
    .msg-status { font-size: 0.75rem; }
    .msg-status.entregado { color: #10B981; }
    .msg-status.leido { color: #3B82F6; }
    .msg-status.fallido { color: #EF4444; }
    .msg-time { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); }

    /* Templates */
    .templates-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
    .add-template-btn {
      padding: 0.75rem 1.5rem; border-radius: 12px;
      border: none; background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: white; font-weight: 600; cursor: pointer;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .template-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .template-card.inactive { opacity: 0.5; }

    .template-header { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .template-icon { font-size: 2rem; }
    .template-header h3 { margin: 0; }
    .template-tipo { color: rgba(255, 255, 255, 0.5); font-size: 0.875rem; }

    .template-preview {
      padding: 1rem; background: rgba(255, 255, 255, 0.05);
      border-radius: 8px; margin-bottom: 1rem;
      border-left: 3px solid #25D366;
    }

    .template-preview p { margin: 0; font-size: 0.875rem; }

    .template-vars { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .var-badge {
      background: rgba(99, 102, 241, 0.2);
      padding: 0.25rem 0.5rem; border-radius: 4px;
      font-size: 0.75rem; font-family: monospace;
    }

    .template-actions { display: flex; gap: 0.5rem; }
    .template-btn {
      padding: 0.5rem 1rem; border-radius: 8px;
      border: none; background: rgba(255, 255, 255, 0.1);
      color: white; cursor: pointer;
    }

    .template-btn.test { background: linear-gradient(135deg, #25D366, #128C7E); }

    /* Campaigns */
    .campaigns-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
    .new-campaign-btn {
      padding: 0.75rem 1.5rem; border-radius: 12px;
      border: none; background: linear-gradient(135deg, #25D366, #128C7E);
      color: white; font-weight: 600; cursor: pointer;
    }

    .campaigns-list { display: flex; flex-direction: column; gap: 1rem; }

    .campaign-card {
      display: grid; grid-template-columns: 1fr auto auto;
      gap: 2rem; padding: 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; align-items: center;
    }

    .campaign-info h3 { margin: 0 0 0.25rem; }
    .campaign-info p { margin: 0; color: rgba(255, 255, 255, 0.6); }

    .campaign-stats { display: flex; gap: 2rem; }
    .c-stat { display: flex; flex-direction: column; align-items: center; }
    .c-stat .value { font-size: 1.25rem; font-weight: 700; }
    .c-stat .label { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); }

    .status-badge {
      padding: 0.5rem 1rem; border-radius: 20px;
      font-size: 0.75rem; font-weight: 600;
    }

    .status-badge.activa { background: rgba(16, 185, 129, 0.2); color: #10B981; }
    .status-badge.programada { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
    .status-badge.finalizada { background: rgba(99, 102, 241, 0.2); color: #8B5CF6; }

    /* Settings */
    .settings-section h2 { margin-bottom: 1.5rem; }

    .settings-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.5rem;
      max-width: 600px;
    }

    .setting-group { margin-bottom: 1.25rem; }
    .setting-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .setting-group input {
      width: 100%; padding: 0.75rem 1rem;
      border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05); color: white;
    }

    .copy-btn {
      margin-top: 0.5rem; padding: 0.5rem 1rem;
      border-radius: 8px; border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white; cursor: pointer;
    }

    .time-range { display: flex; gap: 1rem; align-items: center; }
    .time-range input { width: auto; }

    .toggle-group { display: flex; justify-content: space-between; align-items: center; }
    .toggle-btn {
      width: 56px; height: 28px;
      border-radius: 14px; border: none;
      background: rgba(255, 255, 255, 0.2);
      position: relative; cursor: pointer;
    }

    .toggle-btn.active { background: #25D366; }
    .toggle-slider {
      position: absolute; left: 2px; top: 2px;
      width: 24px; height: 24px;
      border-radius: 50%; background: white;
      transition: transform 0.2s;
    }

    .toggle-btn.active .toggle-slider { transform: translateX(28px); }

    .save-settings-btn {
      width: 100%; padding: 1rem; margin-top: 1rem;
      border-radius: 12px; border: none;
      background: linear-gradient(135deg, #25D366, #128C7E);
      color: white; font-weight: 600; cursor: pointer;
    }

    .auto-messages-section { margin-top: 2rem; max-width: 600px; }
    .auto-messages-section h3 { margin-bottom: 1rem; }

    .auto-msg-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .auto-msg-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem; background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
    }

    .toggle-sm {
      padding: 0.25rem 0.75rem; border-radius: 20px;
      border: none; font-size: 0.75rem; cursor: pointer;
      background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5);
    }

    .toggle-sm.active { background: rgba(37, 211, 102, 0.2); color: #25D366; }

    @media (max-width: 768px) {
      .campaign-card { grid-template-columns: 1fr; }
    }
  `]
})
export class WhatsappComponent implements OnInit {
    private authService = inject(AuthService);

    activeTab: 'messages' | 'templates' | 'campaigns' | 'settings' = 'messages';
    searchQuery = '';
    showNewMessage = false;
    showNewTemplate = false;

    // Config
    config = signal<WhatsAppConfig>({
        numeroWhatsApp: '+56 9 8765 4321',
        apiKey: '',
        webhookUrl: 'https://pos-bff-gateway.up.railway.app/api/webhooks/whatsapp',
        activo: true,
        horariosEnvio: { inicio: '08:00', fin: '21:00' }
    });

    // Demo messages
    messages = signal<WhatsAppMessage[]>([
        { id: '1', destinatario: '+56912345678', nombreCliente: 'María González', template: 'confirmacion_pedido', estado: 'leido', fecha: new Date(Date.now() - 15 * 60000), respuesta: '¡Perfecto, gracias!' },
        { id: '2', destinatario: '+56987654321', nombreCliente: 'Juan Pérez', template: 'pedido_en_camino', estado: 'entregado', fecha: new Date(Date.now() - 45 * 60000) },
        { id: '3', destinatario: '+56911223344', nombreCliente: 'Ana Martínez', template: 'confirmacion_pedido', estado: 'enviado', fecha: new Date(Date.now() - 5 * 60000) },
        { id: '4', destinatario: '+56955667788', nombreCliente: 'Carlos López', template: 'promo_semanal', estado: 'fallido', fecha: new Date(Date.now() - 120 * 60000) },
    ]);

    // Demo templates
    templates = signal<WhatsAppTemplate[]>([
        { id: '1', nombre: 'Confirmación de Pedido', tipo: 'confirmacion', mensaje: '¡Hola {{nombre}}! Tu pedido #{{numero}} ha sido recibido. Total: {{total}}. Te avisaremos cuando esté listo. 🛒', variables: ['nombre', 'numero', 'total'], activo: true },
        { id: '2', nombre: 'Pedido en Camino', tipo: 'pedido', mensaje: '🚚 ¡{{nombre}}, tu pedido #{{numero}} está en camino! Tiempo estimado: {{tiempo}} minutos.', variables: ['nombre', 'numero', 'tiempo'], activo: true },
        { id: '3', nombre: 'Pedido Entregado', tipo: 'confirmacion', mensaje: '✅ ¡Listo {{nombre}}! Tu pedido #{{numero}} ha sido entregado. ¡Gracias por tu compra! ⭐', variables: ['nombre', 'numero'], activo: true },
        { id: '4', nombre: 'Promo Semanal', tipo: 'promo', mensaje: '🎉 ¡Hola {{nombre}}! Esta semana tenemos {{oferta}}. Válido hasta {{fecha}}. ¡Te esperamos! 🥖', variables: ['nombre', 'oferta', 'fecha'], activo: true },
        { id: '5', nombre: 'Recordatorio', tipo: 'recordatorio', mensaje: '👋 ¡Hola {{nombre}}! Te extrañamos. ¿Qué tal un rico pan fresco? Usa código {{codigo}} para 10% OFF.', variables: ['nombre', 'codigo'], activo: false },
    ]);

    // Demo campaigns
    campaigns = signal([
        { nombre: 'Black Friday 2024', descripcion: '20% en toda la pastelería', estado: 'finalizada', enviados: 1250, entregados: 1180, leidos: 890, conversiones: 156 },
        { nombre: 'Navidad Dulce', descripcion: 'Tortas navideñas con descuento', estado: 'activa', enviados: 850, entregados: 820, leidos: 650, conversiones: 89 },
        { nombre: 'Año Nuevo 2025', descripcion: 'Combos familiares especiales', estado: 'programada', enviados: 0, entregados: 0, leidos: 0, conversiones: 0 },
    ]);

    // Computed stats
    mensajesEnviados = signal(47);
    tasaLectura = signal(78);
    pedidosWhatsApp = signal(12);
    ventasWhatsApp = signal(285000);

    filteredMessages = computed(() => {
        const query = this.searchQuery.toLowerCase();
        if (!query) return this.messages();
        return this.messages().filter(m => m.nombreCliente.toLowerCase().includes(query) || m.destinatario.includes(query));
    });

    ngOnInit() { }

    formatPrice(amount: number): string {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
    }

    formatTime(date: Date): string {
        return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    }

    getStatusIcon(estado: string): string {
        switch (estado) {
            case 'enviado': return '✓';
            case 'entregado': return '✓✓';
            case 'leido': return '✓✓';
            case 'fallido': return '❌';
            default: return '';
        }
    }

    getStatusLabel(estado: string): string {
        switch (estado) {
            case 'enviado': return 'Enviado';
            case 'entregado': return 'Entregado';
            case 'leido': return 'Leído';
            case 'fallido': return 'Fallido';
            default: return estado;
        }
    }

    getTemplateIcon(tipo: string): string {
        switch (tipo) {
            case 'pedido': return '📦';
            case 'promo': return '🎁';
            case 'recordatorio': return '⏰';
            case 'confirmacion': return '✅';
            default: return '📝';
        }
    }

    getTemplateTypeLabel(tipo: string): string {
        switch (tipo) {
            case 'pedido': return 'Pedido';
            case 'promo': return 'Promoción';
            case 'recordatorio': return 'Recordatorio';
            case 'confirmacion': return 'Confirmación';
            default: return tipo;
        }
    }

    getTemplatePreview(templateId: string): string {
        const template = this.templates().find(t => t.id === templateId || t.nombre.toLowerCase().includes(templateId.replace('_', ' ')));
        return template?.mensaje.substring(0, 80) + '...' || 'Mensaje no encontrado';
    }

    getCampaignStatusLabel(estado: string): string {
        switch (estado) {
            case 'activa': return '🟢 Activa';
            case 'programada': return '🟡 Programada';
            case 'finalizada': return '✅ Finalizada';
            default: return estado;
        }
    }

    toggleTemplate(template: WhatsAppTemplate) {
        this.templates.update(templates =>
            templates.map(t => t.id === template.id ? { ...t, activo: !t.activo } : t)
        );
    }

    editTemplate(template: WhatsAppTemplate) {
        alert('Editar: ' + template.nombre);
    }

    testTemplate(template: WhatsAppTemplate) {
        alert('Enviando mensaje de prueba con plantilla: ' + template.nombre);
    }

    toggleConfig() {
        this.config.update(c => ({ ...c, activo: !c.activo }));
    }

    copyWebhook() {
        navigator.clipboard.writeText(this.config().webhookUrl);
        alert('URL copiada al portapapeles');
    }
}
