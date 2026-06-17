import {
    Component,
    Input,
    Output,
    EventEmitter,
    signal,
    computed,
    ViewChild,
    ElementRef,
    AfterViewInit
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
      
      <!-- Left Arrow -->
      <button class="scroll-btn left" (click)="scroll(-100)" [class.visible]="canScrollLeft">
        <lucide-icon name="chevron-left" [size]="20"></lucide-icon>
      </button>

      <!-- Scrollable Items -->
      <div class="nav-items-scroll" #scrollContainer (scroll)="checkScroll()">
        @for (item of items; track item.route) {
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
      </div>

      <!-- Right Arrow -->
      <button class="scroll-btn right" (click)="scroll(100)" [class.visible]="canScrollRight">
        <lucide-icon name="chevron-right" [size]="20"></lucide-icon>
      </button>

      <!-- FAB Trigger (Fixed Right) -->
      @if (showFab) {
        <div class="fab-container">
          <button class="nav-fab-trigger" (click)="fabClick.emit()">
            <div class="fab-icon">
              <lucide-icon [name]="fabIcon" [size]="28"></lucide-icon>
            </div>
          </button>
        </div>
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
      background: rgba(15, 15, 26, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 8px 0;
      /* Using max to ensure safe area is respected on all phone models */
      padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      height: calc(72px + env(safe-area-inset-bottom, 0px));
    }

    .bottom-nav.hidden {
      transform: translateY(100%);
    }

    .scroll-btn {
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.7);
      width: 32px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s;
      flex-shrink: 0;
      z-index: 2;
    }
    
    .scroll-btn.visible {
      opacity: 1;
      pointer-events: auto;
    }

    .scroll-btn:active {
      background: rgba(255,255,255,0.1);
    }

    .nav-items-scroll {
      display: flex;
      align-items: center;
      overflow-x: auto;
      scroll-behavior: smooth;
      flex: 1;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none;  /* IE and Edge */
      padding: 0 4px;
      gap: 4px;
    }
    .nav-items-scroll::-webkit-scrollbar {
      display: none;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 12px;
      min-width: 68px;
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
      border-radius: 12px;
      transition: all 0.2s ease;
      position: relative;
      flex-shrink: 0;
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
      white-space: nowrap;
    }

    .fab-container {
      padding: 0 12px 0 8px;
      border-left: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      height: 100%;
    }

    .nav-fab-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
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
    
    canScrollLeft = false;
    canScrollRight = true;
    
    @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

    show(): void {
        this.hidden.set(false);
    }

    hide(): void {
        this.hidden.set(true);
    }

    ngAfterViewInit() {
        this.checkScroll();
    }

    checkScroll() {
        if (!this.scrollContainer) return;
        const el = this.scrollContainer.nativeElement;
        this.canScrollLeft = el.scrollLeft > 0;
        this.canScrollRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - 1);
    }

    scroll(amount: number) {
        if (!this.scrollContainer) return;
        this.scrollContainer.nativeElement.scrollBy({ left: amount, behavior: 'smooth' });
    }
}
