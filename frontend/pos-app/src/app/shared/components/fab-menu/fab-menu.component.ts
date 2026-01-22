import {
    Component,
    Input,
    Output,
    EventEmitter,
    signal,
    computed,
    inject,
    HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { GestureService } from '@core/services/gesture.service';

export interface FABAction {
    id: string;
    icon: string;
    label: string;
    color?: string;
}

@Component({
    selector: 'app-fab-menu',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="fab-container" [class.open]="isOpen()">
      <!-- Backdrop -->
      <div 
        class="fab-backdrop"
        [class.visible]="isOpen()"
        (click)="close()">
      </div>

      <!-- Action buttons -->
      <div class="fab-actions">
        @for (action of actions; track action.id; let i = $index) {
          <button 
            class="fab-action"
            [class.visible]="isOpen()"
            [style.transition-delay]="getDelay(i)"
            [style.--action-color]="action.color || '#6366F1'"
            (click)="onActionClick(action)">
            <lucide-icon [name]="action.icon" [size]="20"></lucide-icon>
            <span class="action-label">{{ action.label }}</span>
          </button>
        }
      </div>

      <!-- Main FAB -->
      <button 
        class="fab-main"
        [class.open]="isOpen()"
        (click)="toggle()">
        <lucide-icon 
          [name]="isOpen() ? 'x' : icon" 
          [size]="28"
          class="fab-icon">
        </lucide-icon>
      </button>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      position: fixed;
      bottom: calc(80px + env(safe-area-inset-bottom, 0));
      right: 16px;
      z-index: 950;
    }

    .fab-container {
      position: relative;
    }

    .fab-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: -1;
    }

    .fab-backdrop.visible {
      opacity: 1;
      visibility: visible;
    }

    .fab-actions {
      position: absolute;
      bottom: 70px;
      right: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }

    .fab-action {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--action-color);
      border: none;
      border-radius: 28px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      opacity: 0;
      transform: translateY(20px) scale(0.8);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      white-space: nowrap;
    }

    .fab-action.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .fab-action:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
    }

    .fab-action:active {
      transform: scale(0.95);
    }

    .action-label {
      max-width: 0;
      overflow: hidden;
      transition: max-width 0.3s ease;
    }

    .fab-action.visible .action-label {
      max-width: 150px;
    }

    .fab-main {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);
      border: none;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      box-shadow: 
        0 6px 24px rgba(99, 102, 241, 0.4),
        0 0 40px rgba(99, 102, 241, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .fab-main:hover {
      transform: scale(1.1);
      box-shadow: 
        0 8px 32px rgba(99, 102, 241, 0.5),
        0 0 50px rgba(99, 102, 241, 0.3);
    }

    .fab-main:active {
      transform: scale(0.95);
    }

    .fab-main.open {
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .fab-icon {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .fab-main.open .fab-icon {
      transform: rotate(90deg);
    }

    @media (min-width: 768px) {
      :host {
        bottom: 24px;
        right: 24px;
      }
    }
  `]
})
export class FABMenuComponent {
    private gestureService = inject(GestureService);

    @Input() actions: FABAction[] = [];
    @Input() icon = 'plus';

    @Output() actionClick = new EventEmitter<FABAction>();

    isOpen = signal(false);

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.isOpen()) {
            this.close();
        }
    }

    toggle(): void {
        this.gestureService.haptic('light');
        this.isOpen.update(v => !v);
    }

    open(): void {
        this.gestureService.haptic('light');
        this.isOpen.set(true);
    }

    close(): void {
        this.isOpen.set(false);
    }

    onActionClick(action: FABAction): void {
        this.gestureService.haptic('medium');
        this.actionClick.emit(action);
        this.close();
    }

    getDelay(index: number): string {
        // Stagger animation from bottom to top
        const reverseIndex = this.actions.length - 1 - index;
        return `${reverseIndex * 50}ms`;
    }
}
