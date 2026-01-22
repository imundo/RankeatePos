import {
    Component,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    ElementRef,
    AfterViewInit,
    OnDestroy,
    inject,
    signal,
    computed,
    HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GestureService, PanEvent } from '@core/services/gesture.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-bottom-sheet',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- Backdrop -->
    <div 
      class="bottom-sheet-backdrop"
      [class.visible]="isOpen()"
      [style.opacity]="backdropOpacity()"
      (click)="onBackdropClick()">
    </div>

    <!-- Sheet -->
    <div 
      class="bottom-sheet-container"
      #sheetContainer
      [class.open]="isOpen()"
      [style.transform]="sheetTransform()"
      [style.transition]="isAnimating ? 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)' : 'none'">
      
      <!-- Handle -->
      <div class="bottom-sheet-handle" #handleElement>
        <div class="handle-bar"></div>
      </div>

      <!-- Header -->
      <div class="bottom-sheet-header" *ngIf="showHeader">
        <ng-content select="[header]"></ng-content>
      </div>

      <!-- Content -->
      <div class="bottom-sheet-content" [style.max-height]="contentMaxHeight()">
        <ng-content select="[content]"></ng-content>
      </div>

      <!-- Footer -->
      <div class="bottom-sheet-footer" *ngIf="showFooter">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 1000;
      pointer-events: none;
    }

    :host.active {
      pointer-events: auto;
    }

    .bottom-sheet-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      pointer-events: none;
    }

    .bottom-sheet-backdrop.visible {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .bottom-sheet-container {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(180deg, rgba(30, 30, 50, 0.98) 0%, rgba(20, 20, 35, 0.99) 100%);
      border-top-left-radius: 24px;
      border-top-right-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-bottom: none;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
      transform: translateY(100%);
      will-change: transform;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      max-height: 95vh;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }

    .bottom-sheet-container.open {
      transform: translateY(0);
    }

    .bottom-sheet-handle {
      display: flex;
      justify-content: center;
      padding: 12px 0 8px;
      cursor: grab;
      touch-action: none;
    }

    .bottom-sheet-handle:active {
      cursor: grabbing;
    }

    .handle-bar {
      width: 40px;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      transition: background 0.2s ease;
    }

    .bottom-sheet-handle:hover .handle-bar {
      background: rgba(255, 255, 255, 0.5);
    }

    .bottom-sheet-header {
      padding: 0 16px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .bottom-sheet-content {
      flex: 1;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      padding: 16px;
    }

    .bottom-sheet-footer {
      padding: 12px 16px;
      padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(15, 15, 25, 0.9);
    }
  `]
})
export class BottomSheetComponent implements AfterViewInit, OnDestroy {
    private gestureService = inject(GestureService);
    private destroy$ = new Subject<void>();

    @ViewChild('sheetContainer') sheetContainer!: ElementRef<HTMLDivElement>;
    @ViewChild('handleElement') handleElement!: ElementRef<HTMLDivElement>;

    // Inputs
    @Input() snapPoints: number[] = [0.25, 0.5, 0.9]; // Percentage of screen height
    @Input() initialSnap = 0; // Index of initial snap point
    @Input() showHeader = true;
    @Input() showFooter = true;
    @Input() dismissible = true;
    @Input() showBackdrop = true;

    // Outputs
    @Output() snapChange = new EventEmitter<number>();
    @Output() closed = new EventEmitter<void>();
    @Output() opened = new EventEmitter<void>();

    // State
    isOpen = signal(false);
    currentSnapIndex = signal(0);
    currentY = signal(0);
    isAnimating = false;

    private windowHeight = window.innerHeight;
    private dragStartY = 0;
    private dragStartSnapY = 0;

    // Computed values
    sheetTransform = computed(() => {
        if (!this.isOpen()) {
            return 'translateY(100%)';
        }
        const snapHeight = this.getSnapHeight(this.currentSnapIndex());
        const offset = this.currentY();
        return `translateY(calc(100% - ${snapHeight}px + ${offset}px))`;
    });

    backdropOpacity = computed(() => {
        if (!this.isOpen()) return 0;
        const maxSnap = Math.max(...this.snapPoints);
        const currentSnap = this.snapPoints[this.currentSnapIndex()];
        return (currentSnap / maxSnap) * 0.6;
    });

    contentMaxHeight = computed(() => {
        const snapHeight = this.getSnapHeight(this.currentSnapIndex());
        // Account for handle, header, footer
        return `${snapHeight - 120}px`;
    });

    @HostListener('window:resize')
    onResize(): void {
        this.windowHeight = window.innerHeight;
    }

    ngAfterViewInit(): void {
        this.setupGestures();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ============================================
    // PUBLIC METHODS
    // ============================================

    open(snapIndex?: number): void {
        this.currentSnapIndex.set(snapIndex ?? this.initialSnap);
        this.isOpen.set(true);
        this.isAnimating = true;

        setTimeout(() => {
            this.isAnimating = false;
            this.opened.emit();
        }, 400);
    }

    close(): void {
        this.isAnimating = true;
        this.isOpen.set(false);

        setTimeout(() => {
            this.isAnimating = false;
            this.closed.emit();
        }, 400);
    }

    snapTo(index: number): void {
        if (index < 0 || index >= this.snapPoints.length) return;

        this.isAnimating = true;
        this.currentSnapIndex.set(index);
        this.currentY.set(0);
        this.snapChange.emit(index);

        setTimeout(() => {
            this.isAnimating = false;
        }, 400);
    }

    // ============================================
    // GESTURE HANDLING
    // ============================================

    private setupGestures(): void {
        if (!this.handleElement?.nativeElement) return;

        this.gestureService
            .handlePan(this.handleElement.nativeElement)
            .pipe(takeUntil(this.destroy$))
            .subscribe((event) => this.onPan(event));
    }

    private onPan(event: PanEvent): void {
        if (event.isFirst) {
            this.dragStartY = 0;
            this.dragStartSnapY = this.getSnapHeight(this.currentSnapIndex());
        }

        // Update current offset
        this.currentY.set(event.deltaY);

        if (event.isFinal) {
            this.onPanEnd(event);
        }
    }

    private onPanEnd(event: PanEvent): void {
        const velocity = event.velocityY;
        const currentOffset = this.currentY();
        const currentSnapHeight = this.getSnapHeight(this.currentSnapIndex());
        const newHeight = currentSnapHeight - currentOffset;

        // Determine if should dismiss
        if (this.dismissible && (velocity > 0.5 || newHeight < this.windowHeight * 0.1)) {
            this.gestureService.haptic('light');
            this.close();
            return;
        }

        // Find closest snap point
        const closestSnapIndex = this.findClosestSnap(newHeight, velocity);

        this.gestureService.haptic('light');
        this.isAnimating = true;
        this.currentY.set(0);
        this.currentSnapIndex.set(closestSnapIndex);
        this.snapChange.emit(closestSnapIndex);

        setTimeout(() => {
            this.isAnimating = false;
        }, 400);
    }

    private findClosestSnap(currentHeight: number, velocity: number): number {
        const snapHeights = this.snapPoints.map((_, i) => this.getSnapHeight(i));

        // If velocity is significant, snap in direction of movement
        if (Math.abs(velocity) > 0.3) {
            const direction = velocity > 0 ? -1 : 1; // Positive velocity = moving down = smaller snap
            const currentIndex = this.currentSnapIndex();
            const newIndex = Math.max(0, Math.min(this.snapPoints.length - 1, currentIndex + direction));
            return newIndex;
        }

        // Otherwise, snap to closest
        let closestIndex = 0;
        let closestDistance = Infinity;

        snapHeights.forEach((height, index) => {
            const distance = Math.abs(height - currentHeight);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        return closestIndex;
    }

    private getSnapHeight(index: number): number {
        const snapPoint = this.snapPoints[index] ?? 0.25;
        return this.windowHeight * snapPoint;
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    onBackdropClick(): void {
        if (this.dismissible) {
            this.close();
        }
    }
}
