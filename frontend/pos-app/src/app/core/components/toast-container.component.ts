import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-toast-container',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
      @for (toast of toastService.activeToasts(); track toast.id) {
        <div 
          class="toast" 
          [class]="'toast-' + toast.type"
          (click)="toastService.dismiss(toast.id)"
        >
          <span class="toast-icon">
            @switch (toast.type) {
              @case ('success') { ✅ }
              @case ('error') { ❌ }
              @case ('warning') { ⚠️ }
              @case ('info') { ℹ️ }
            }
          </span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close">×</button>
        </div>
      }
    </div>
  `,
    styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 360px;
    }

    @media (max-width: 768px) {
      .toast-container {
        top: auto;
        bottom: 5rem;
        right: 0.75rem;
        left: 0.75rem;
        max-width: none;
      }
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 12px;
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @media (max-width: 768px) {
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    }

    .toast-success {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9));
      color: white;
    }

    .toast-error {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
      color: white;
    }

    .toast-warning {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9));
      color: white;
    }

    .toast-info {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(79, 70, 229, 0.9));
      color: white;
    }

    .toast-icon {
      font-size: 1.25rem;
    }

    .toast-message {
      flex: 1;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .toast-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      transition: all 0.2s;
    }

    .toast-close:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class ToastContainerComponent {
    toastService = inject(ToastService);
}
