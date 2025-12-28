import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Review {
  id: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  isPublic: boolean;
  response?: string;
  respondedAt?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="reviews-container">
      <!-- Header -->
      <header class="reviews-header">
        <div class="header-left">
          <a routerLink="/dashboard" class="back-btn">←</a>
          <div class="title-section">
            <h1>⭐ Reviews & Feedback</h1>
            <p class="subtitle">Gestión de reputación y feedback de clientes</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" (click)="requestReviews()">
            📨 Solicitar Reviews
          </button>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card gradient-gold">
          <div class="stat-content">
            <span class="stat-value">{{ averageRating().toFixed(1) }}</span>
            <div class="stars">
              @for (star of [1,2,3,4,5]; track star) {
                <span [class.filled]="star <= Math.round(averageRating())">★</span>
              }
            </div>
            <span class="stat-label">Rating Promedio</span>
          </div>
        </div>
        <div class="stat-card gradient-purple">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <span class="stat-value">{{ npsScore() }}</span>
            <span class="stat-label">NPS Score</span>
          </div>
        </div>
        <div class="stat-card gradient-blue">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <span class="stat-value">{{ totalReviews() }}</span>
            <span class="stat-label">Total Reviews</span>
          </div>
        </div>
        <div class="stat-card gradient-amber">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <span class="stat-value">{{ pendingCount() }}</span>
            <span class="stat-label">Pendientes</span>
          </div>
        </div>
      </div>

      <!-- Rating Distribution -->
      <div class="rating-distribution">
        <h3>📈 Distribución de Ratings</h3>
        <div class="distribution-bars">
          @for (rating of [5,4,3,2,1]; track rating) {
            <div class="rating-row">
              <span class="rating-label">{{ rating }} ★</span>
              <div class="bar-container">
                <div class="bar" [style.width.%]="getRatingPercentage(rating)"></div>
              </div>
              <span class="rating-count">{{ getRatingCount(rating) }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active]="activeTab === 'all'" (click)="activeTab = 'all'">
          📋 Todas
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'pending'" (click)="activeTab = 'pending'">
          ⏳ Pendientes ({{ pendingCount() }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'unanswered'" (click)="activeTab = 'unanswered'">
          💬 Sin Responder
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'negative'" (click)="activeTab = 'negative'">
          👎 Negativas
        </button>
      </div>

      <!-- Reviews List -->
      <div class="reviews-list">
        @for (review of filteredReviews(); track review.id) {
          <div class="review-card" [class]="'status-' + review.status.toLowerCase()">
            <div class="review-header">
              <div class="reviewer-info">
                <div class="avatar">{{ review.customerName.charAt(0) }}</div>
                <div class="info">
                  <span class="name">{{ review.customerName }}</span>
                  <span class="date">{{ formatDate(review.createdAt) }}</span>
                </div>
              </div>
              <div class="review-rating">
                @for (star of [1,2,3,4,5]; track star) {
                  <span class="star" [class.filled]="star <= review.rating">★</span>
                }
              </div>
              @if (review.isVerified) {
                <span class="verified-badge">✓ Verificado</span>
              }
            </div>
            
            <div class="review-content">
              <p>{{ review.comment }}</p>
            </div>
            
            @if (review.response) {
              <div class="review-response">
                <div class="response-header">
                  <span class="response-icon">💬</span>
                  <span>Respuesta del negocio</span>
                </div>
                <p>{{ review.response }}</p>
              </div>
            }
            
            <div class="review-footer">
              <div class="review-stats">
                <span class="helpful">👍 {{ review.helpfulCount }} útil</span>
                <span class="status-badge" [class]="review.status.toLowerCase()">
                  {{ getStatusLabel(review.status) }}
                </span>
              </div>
              <div class="review-actions">
                @if (review.status === 'PENDING') {
                  <button class="action-btn approve" (click)="approveReview(review)">✅ Aprobar</button>
                  <button class="action-btn reject" (click)="rejectReview(review)">❌ Rechazar</button>
                }
                @if (!review.response && review.status === 'APPROVED') {
                  <button class="action-btn respond" (click)="openResponseModal(review)">💬 Responder</button>
                }
                <button class="action-btn flag" (click)="flagReview(review)">🚩</button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <span class="empty-icon">⭐</span>
            <h3>No hay reviews {{ getTabLabel() }}</h3>
            <p>Los reviews de clientes aparecerán aquí</p>
          </div>
        }
      </div>

      <!-- Response Modal -->
      @if (showResponseModal && selectedReview) {
        <div class="modal-overlay" (click)="showResponseModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>💬 Responder Review</h2>
            
            <div class="review-preview">
              <div class="stars">
                @for (star of [1,2,3,4,5]; track star) {
                  <span [class.filled]="star <= selectedReview.rating">★</span>
                }
              </div>
              <p>"{{ selectedReview.comment }}"</p>
              <span class="customer">- {{ selectedReview.customerName }}</span>
            </div>
            
            <div class="form-group">
              <label>Tu respuesta</label>
              <textarea [(ngModel)]="responseText" rows="4" placeholder="Escribe tu respuesta..."></textarea>
            </div>
            
            <div class="quick-responses">
              <span class="label">Respuestas rápidas:</span>
              <button (click)="useQuickResponse('Gracias por tu comentario!')">👍 Agradecer</button>
              <button (click)="useQuickResponse('Lamentamos tu experiencia. Nos pondremos en contacto.')">😔 Disculpas</button>
            </div>
            
            <div class="modal-actions">
              <button class="cancel-btn" (click)="showResponseModal = false">Cancelar</button>
              <button class="save-btn" (click)="submitResponse()">Enviar Respuesta</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .reviews-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
      color: white;
      padding: 1.5rem;
    }

    .reviews-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
    }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .back-btn {
      width: 48px; height: 48px; border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      display: flex; align-items: center; justify-content: center;
      text-decoration: none; color: white; font-size: 1.5rem;
    }
    .title-section h1 { font-size: 1.75rem; margin: 0; }
    .subtitle { color: rgba(255, 255, 255, 0.6); margin: 0.25rem 0 0; }

    .action-btn {
      padding: 0.75rem 1.5rem; border-radius: 12px;
      font-weight: 600; cursor: pointer; border: none;
    }
    .action-btn.primary { background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; }
    .action-btn.secondary { background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); }

    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem; margin-bottom: 2rem;
    }
    .stat-card {
      padding: 1.5rem; border-radius: 16px;
      display: flex; align-items: center; gap: 1rem;
    }
    .gradient-gold { background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%); }
    .gradient-purple { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); }
    .gradient-blue { background: linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%); }
    .gradient-amber { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); }

    .stat-icon { font-size: 2.5rem; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 2rem; font-weight: 800; }
    .stat-label { font-size: 0.875rem; opacity: 0.9; }

    .stars { display: flex; gap: 0.25rem; }
    .stars span { color: rgba(255, 255, 255, 0.3); font-size: 1.25rem; }
    .stars span.filled { color: white; }

    /* Rating Distribution */
    .rating-distribution {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;
    }
    .rating-distribution h3 { margin: 0 0 1rem; font-size: 1rem; }
    .distribution-bars { display: flex; flex-direction: column; gap: 0.5rem; }
    .rating-row { display: flex; align-items: center; gap: 0.75rem; }
    .rating-label { width: 40px; font-size: 0.85rem; color: rgba(255, 255, 255, 0.7); }
    .bar-container { flex: 1; height: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; overflow: hidden; }
    .bar { height: 100%; background: linear-gradient(90deg, #F59E0B, #FBBF24); border-radius: 4px; }
    .rating-count { width: 30px; font-size: 0.85rem; text-align: right; color: rgba(255, 255, 255, 0.7); }

    /* Tabs */
    .tabs-container {
      display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.05); padding: 0.5rem; border-radius: 12px;
      overflow-x: auto;
    }
    .tab-btn {
      padding: 0.75rem 1.5rem; border: none;
      background: transparent; color: rgba(255, 255, 255, 0.6);
      font-weight: 600; cursor: pointer; border-radius: 8px; white-space: nowrap;
    }
    .tab-btn.active { background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; }

    /* Reviews List */
    .reviews-list { display: flex; flex-direction: column; gap: 1rem; }

    .review-card {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px; padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .review-card.status-pending { border-left: 4px solid #F59E0B; }
    .review-card.status-approved { border-left: 4px solid #10B981; }
    .review-card.status-rejected { border-left: 4px solid #EF4444; opacity: 0.6; }
    .review-card.status-flagged { border-left: 4px solid #EC4899; }

    .review-header {
      display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;
    }
    .reviewer-info { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700;
    }
    .info { display: flex; flex-direction: column; }
    .info .name { font-weight: 600; }
    .info .date { font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); }

    .review-rating { display: flex; gap: 0.1rem; }
    .star { font-size: 1.25rem; color: rgba(255, 255, 255, 0.2); }
    .star.filled { color: #FBBF24; }

    .verified-badge {
      background: rgba(16, 185, 129, 0.2); color: #34D399;
      padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem;
    }

    .review-content { margin-bottom: 1rem; }
    .review-content p { margin: 0; line-height: 1.5; color: rgba(255, 255, 255, 0.9); }

    .review-response {
      background: rgba(99, 102, 241, 0.1); border-radius: 12px;
      padding: 1rem; margin-bottom: 1rem;
    }
    .response-header {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.85rem; color: #A5B4FC; margin-bottom: 0.5rem;
    }
    .review-response p { margin: 0; font-size: 0.9rem; color: rgba(255, 255, 255, 0.8); }

    .review-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .review-stats { display: flex; align-items: center; gap: 1rem; }
    .helpful { font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); }
    .status-badge {
      padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600;
    }
    .status-badge.pending { background: rgba(245, 158, 11, 0.2); color: #FBBF24; }
    .status-badge.approved { background: rgba(16, 185, 129, 0.2); color: #34D399; }
    .status-badge.rejected { background: rgba(239, 68, 68, 0.2); color: #F87171; }
    .status-badge.flagged { background: rgba(236, 72, 153, 0.2); color: #F472B6; }

    .review-actions { display: flex; gap: 0.5rem; }
    .review-actions button {
      padding: 0.4rem 0.75rem; border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: transparent; color: white; cursor: pointer;
      font-size: 0.8rem;
    }
    .review-actions button.approve:hover { background: rgba(16, 185, 129, 0.2); }
    .review-actions button.reject:hover { background: rgba(239, 68, 68, 0.2); }
    .review-actions button.respond:hover { background: rgba(99, 102, 241, 0.2); }

    .empty-state {
      text-align: center; padding: 4rem;
      background: rgba(255, 255, 255, 0.03); border-radius: 16px;
    }
    .empty-icon { font-size: 4rem; }
    .empty-state h3 { margin: 1rem 0 0.5rem; }
    .empty-state p { color: rgba(255, 255, 255, 0.5); }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal-content {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 20px; padding: 2rem;
      width: 100%; max-width: 500px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .modal-content h2 { margin: 0 0 1.5rem; }

    .review-preview {
      background: rgba(255, 255, 255, 0.05); border-radius: 12px;
      padding: 1rem; margin-bottom: 1.5rem;
    }
    .review-preview .stars { margin-bottom: 0.5rem; }
    .review-preview p { margin: 0 0 0.5rem; font-style: italic; }
    .review-preview .customer { font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; }
    .form-group textarea {
      width: 100%; padding: 0.75rem 1rem; border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05); color: white;
      resize: vertical;
    }

    .quick-responses { margin-bottom: 1.5rem; }
    .quick-responses .label { display: block; font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.5rem; }
    .quick-responses button {
      padding: 0.5rem 0.75rem; border-radius: 8px; margin-right: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.05); color: white; cursor: pointer;
      font-size: 0.8rem;
    }

    .modal-actions { display: flex; gap: 1rem; }
    .cancel-btn, .save-btn { flex: 1; padding: 0.875rem; border-radius: 12px; font-weight: 600; cursor: pointer; }
    .cancel-btn { background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: white; }
    .save-btn { background: linear-gradient(135deg, #6366F1, #8B5CF6); border: none; color: white; }
  `]
})
export class ReviewsComponent implements OnInit {
  Math = Math;

  activeTab: 'all' | 'pending' | 'unanswered' | 'negative' = 'all';
  showResponseModal = false;
  selectedReview: Review | null = null;
  responseText = '';

  reviews = signal<Review[]>([]);

  private mockReviews: Review[] = [
    { id: '1', customerId: '1', customerName: 'María González', rating: 5, comment: '¡Excelente atención y productos de primera calidad! Siempre vuelvo.', isPublic: true, response: '¡Muchas gracias María! Nos alegra mucho saber que disfrutas de nuestros productos.', respondedAt: '2024-12-21', status: 'APPROVED', isVerified: true, helpfulCount: 12, createdAt: '2024-12-20' },
    { id: '2', customerId: '2', customerName: 'Carlos Rodríguez', rating: 5, comment: 'El mejor lugar para reuniones de negocios. Ambiente perfecto.', isPublic: true, response: '¡Gracias Carlos! Es un placer atenderte.', respondedAt: '2024-12-19', status: 'APPROVED', isVerified: true, helpfulCount: 8, createdAt: '2024-12-18' },
    { id: '3', customerId: '3', customerName: 'Ana López', rating: 5, comment: 'Me encanta el programa de lealtad, los beneficios son geniales.', isPublic: true, status: 'APPROVED', isVerified: true, helpfulCount: 5, createdAt: '2024-12-22' },
    { id: '4', customerId: '4', customerName: 'Pedro Sánchez', rating: 4, comment: 'Muy buena comida, solo el tiempo de espera fue un poco largo.', isPublic: true, response: 'Gracias por tu feedback Pedro. Estamos trabajando para mejorar los tiempos.', respondedAt: '2024-12-16', status: 'APPROVED', isVerified: true, helpfulCount: 3, createdAt: '2024-12-15' },
    { id: '5', customerId: '7', customerName: 'Valentina Muñoz', rating: 3, comment: 'La comida estuvo bien, pero el servicio podría mejorar.', isPublic: true, response: 'Gracias por tu honestidad Valentina. Trabajaremos en mejorar el servicio.', respondedAt: '2024-12-06', status: 'APPROVED', isVerified: true, helpfulCount: 2, createdAt: '2024-12-05' },
    { id: '6', customerId: '12', customerName: 'Joaquín Sepúlveda', rating: 5, comment: 'Primera vez que vengo y quedé encantado!', isPublic: true, status: 'PENDING', isVerified: true, helpfulCount: 0, createdAt: '2024-12-20' },
    { id: '7', customerId: '13', customerName: 'Isidora Valenzuela', rating: 4, comment: 'Buena experiencia en general.', isPublic: true, status: 'PENDING', isVerified: true, helpfulCount: 0, createdAt: '2024-12-18' },
    { id: '8', customerId: '16', customerName: 'Felipe Morales', rating: 2, comment: 'Mi última visita no fue buena, la comida llegó fría.', isPublic: true, status: 'PENDING', isVerified: false, helpfulCount: 0, createdAt: '2024-10-01' },
    { id: '9', customerId: '17', customerName: 'Javiera Núñez', rating: 1, comment: 'Muy decepcionado. No volvería.', isPublic: false, status: 'FLAGGED', isVerified: false, helpfulCount: 0, createdAt: '2024-09-15' }
  ];

  filteredReviews = computed(() => {
    return this.reviews().filter(r => {
      switch (this.activeTab) {
        case 'pending': return r.status === 'PENDING';
        case 'unanswered': return r.status === 'APPROVED' && !r.response;
        case 'negative': return r.rating <= 2;
        default: return true;
      }
    });
  });

  totalReviews = computed(() => this.reviews().filter(r => r.status === 'APPROVED').length);
  pendingCount = computed(() => this.reviews().filter(r => r.status === 'PENDING').length);

  averageRating = computed(() => {
    const approved = this.reviews().filter(r => r.status === 'APPROVED');
    if (!approved.length) return 0;
    return approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;
  });

  npsScore = computed(() => {
    const approved = this.reviews().filter(r => r.status === 'APPROVED');
    if (!approved.length) return 0;
    const promoters = approved.filter(r => r.rating === 5).length;
    const detractors = approved.filter(r => r.rating <= 2).length;
    return Math.round((promoters - detractors) / approved.length * 100);
  });

  ngOnInit() {
    this.reviews.set(this.mockReviews);
  }

  getRatingCount(rating: number): number {
    return this.reviews().filter(r => r.rating === rating && r.status === 'APPROVED').length;
  }

  getRatingPercentage(rating: number): number {
    const total = this.totalReviews();
    return total > 0 ? (this.getRatingCount(rating) / total) * 100 : 0;
  }

  approveReview(review: Review) {
    this.reviews.update(list => list.map(r => r.id === review.id ? { ...r, status: 'APPROVED' as const } : r));
  }

  rejectReview(review: Review) {
    this.reviews.update(list => list.map(r => r.id === review.id ? { ...r, status: 'REJECTED' as const } : r));
  }

  flagReview(review: Review) {
    this.reviews.update(list => list.map(r => r.id === review.id ? { ...r, status: 'FLAGGED' as const } : r));
  }

  openResponseModal(review: Review) {
    this.selectedReview = review;
    this.responseText = '';
    this.showResponseModal = true;
  }

  useQuickResponse(text: string) {
    this.responseText = text;
  }

  submitResponse() {
    if (!this.selectedReview || !this.responseText) return;

    this.reviews.update(list => list.map(r =>
      r.id === this.selectedReview!.id
        ? { ...r, response: this.responseText, respondedAt: new Date().toISOString() }
        : r
    ));

    this.showResponseModal = false;
    this.selectedReview = null;
    this.responseText = '';
  }

  requestReviews() { alert('Solicitar reviews: funcionalidad pendiente'); }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = { 'PENDING': 'Pendiente', 'APPROVED': 'Aprobado', 'REJECTED': 'Rechazado', 'FLAGGED': 'Marcado' };
    return labels[status] || status;
  }

  getTabLabel(): string {
    const labels: Record<string, string> = { 'all': '', 'pending': 'pendientes', 'unanswered': 'sin responder', 'negative': 'negativas' };
    return labels[this.activeTab] || '';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CL');
  }
}
