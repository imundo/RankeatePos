import {
    Component,
    Input,
    Output,
    EventEmitter,
    signal,
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

export interface NavItem {
    route: string;
    icon: string;
    label: string;
    badge?: number;
}

@Component({
    selector: 'app-bottom-nav',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
    template: `
    <nav class="bottom-nav" [class.hidden]="hidden()">
      @for (item of leftItems(); track item.route) {
        <a 
          class="nav-item"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.route === '/' }">
          <div class="nav-icon-container">
            <lucide-icon [name]="item.icon" [size]="24"></lucide-icon>
            @if (item.badge && item.badge > 0) {
              <span class="nav-badge">{{ item.badge > 99 ? '99+' : item.badge }}</span>
            }
          </div>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      }

      <!-- FAB Trigger (Center) -->
      @if (showFab) {
        <button class="nav-fab-trigger" (click)="fabClick.emit()">
          <div class="fab-icon">
            <lucide-icon [name]="fabIcon" [size]="28"></lucide-icon>
          </div>
        </button>
      }

      @for (item of rightItems(); track item.route) {
        <a 
          class="nav-item"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.route === '/' }">
          <div class="nav-icon-container">
            <lucide-icon [name]="item.icon" [size]="24"></lucide-icon>
            @if (item.badge && item.badge > 0) {
              <span class="nav-badge">{{ item.badge > 99 ? '99+' : item.badge }}</span>
            }
          </div>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
    styles: [`
    :host {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 900;
    }

    .bottom-nav {
      display: flex;
      align-items: center;
      justify-content: space-around;
      background: rgba(15, 15, 26, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 8px 12px;
      padding-bottom: calc(8px + env(safe-area-inset-bottom, 0));
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .bottom-nav.hidden {
      transform: translateY(100%);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 12px;
      min-width: 64px;
      min-height: 48px;
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
      border-radius: 12px;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-item:hover {
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-item.active {
      color: #6366F1;
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 3px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 0 0 3px 3px;
    }

    .nav-icon-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-badge {
      position: absolute;
      top: -6px;
      right: -10px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: #EF4444;
      color: white;
      font-size: 10px;
      font-weight: 600;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
    }

    .nav-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    .nav-fab-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      margin-top: -20px;
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);
      border: none;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      box-shadow: 
        0 4px 20px rgba(99, 102, 241, 0.4),
        0 0 40px rgba(99, 102, 241, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-fab-trigger:hover {
      transform: scale(1.1);
      box-shadow: 
        0 6px 28px rgba(99, 102, 241, 0.5),
        0 0 50px rgba(99, 102, 241, 0.3);
    }

    .nav-fab-trigger:active {
      transform: scale(0.95);
    }

    .fab-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media (min-width: 768px) {
      .bottom-nav {
        display: none;
      }
    }
  `]
})
export class BottomNavComponent {
    @Input() items: NavItem[] = [];
    @Input() showFab = true;
    @Input() fabIcon = 'plus';

    @Output() fabClick = new EventEmitter<void>();

    hidden = signal(false);

    leftItems = computed(() => {
        const half = Math.ceil(this.items.length / 2);
        return this.items.slice(0, half);
    });

    rightItems = computed(() => {
        const half = Math.ceil(this.items.length / 2);
        return this.items.slice(half);
    });

    show(): void {
        this.hidden.set(false);
    }

    hide(): void {
        this.hidden.set(true);
    }
}
