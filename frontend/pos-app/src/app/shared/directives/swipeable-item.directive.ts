import {
    Directive,
    ElementRef,
    Input,
    Output,
    EventEmitter,
    OnInit,
    OnDestroy,
    inject,
    Renderer2,
} from '@angular/core';
import { GestureService, PanEvent } from '@core/services/gesture.service';
import { Subject, takeUntil } from 'rxjs';

@Directive({
    selector: '[appSwipeable]',
    standalone: true,
})
export class SwipeableItemDirective implements OnInit, OnDestroy {
    private el = inject(ElementRef);
    private renderer = inject(Renderer2);
    private gestureService = inject(GestureService);
    private destroy$ = new Subject<void>();

    @Input() swipeThreshold = 80; // px to trigger action
    @Input() maxSwipe = 120; // max swipe distance
    @Input() leftActionColor = '#EF4444'; // Red for delete
    @Input() rightActionColor = '#10B981'; // Green for confirm
    @Input() leftActionIcon = '🗑️';
    @Input() rightActionIcon = '✓';

    @Output() swipeLeft = new EventEmitter<void>();
    @Output() swipeRight = new EventEmitter<void>();

    private wrapper!: HTMLElement;
    private content!: HTMLElement;
    private leftAction!: HTMLElement;
    private rightAction!: HTMLElement;
    private currentX = 0;
    private isAnimating = false;

    ngOnInit(): void {
        this.setupDOM();
        this.setupGestures();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupDOM(): void {
        const element = this.el.nativeElement as HTMLElement;

        // Create wrapper
        this.wrapper = this.renderer.createElement('div');
        this.renderer.addClass(this.wrapper, 'swipeable-wrapper');
        this.renderer.setStyle(this.wrapper, 'position', 'relative');
        this.renderer.setStyle(this.wrapper, 'overflow', 'hidden');
        this.renderer.setStyle(this.wrapper, 'borderRadius', '12px');

        // Create left action (appears when swiping right)
        this.leftAction = this.renderer.createElement('div');
        this.renderer.addClass(this.leftAction, 'swipe-action');
        this.renderer.addClass(this.leftAction, 'swipe-action-left');
        this.renderer.setStyle(this.leftAction, 'position', 'absolute');
        this.renderer.setStyle(this.leftAction, 'left', '0');
        this.renderer.setStyle(this.leftAction, 'top', '0');
        this.renderer.setStyle(this.leftAction, 'bottom', '0');
        this.renderer.setStyle(this.leftAction, 'width', `${this.maxSwipe}px`);
        this.renderer.setStyle(this.leftAction, 'background', this.rightActionColor);
        this.renderer.setStyle(this.leftAction, 'display', 'flex');
        this.renderer.setStyle(this.leftAction, 'alignItems', 'center');
        this.renderer.setStyle(this.leftAction, 'justifyContent', 'flex-start');
        this.renderer.setStyle(this.leftAction, 'paddingLeft', '20px');
        this.renderer.setStyle(this.leftAction, 'fontSize', '1.5rem');
        this.leftAction.textContent = this.rightActionIcon;

        // Create right action (appears when swiping left)
        this.rightAction = this.renderer.createElement('div');
        this.renderer.addClass(this.rightAction, 'swipe-action');
        this.renderer.addClass(this.rightAction, 'swipe-action-right');
        this.renderer.setStyle(this.rightAction, 'position', 'absolute');
        this.renderer.setStyle(this.rightAction, 'right', '0');
        this.renderer.setStyle(this.rightAction, 'top', '0');
        this.renderer.setStyle(this.rightAction, 'bottom', '0');
        this.renderer.setStyle(this.rightAction, 'width', `${this.maxSwipe}px`);
        this.renderer.setStyle(this.rightAction, 'background', this.leftActionColor);
        this.renderer.setStyle(this.rightAction, 'display', 'flex');
        this.renderer.setStyle(this.rightAction, 'alignItems', 'center');
        this.renderer.setStyle(this.rightAction, 'justifyContent', 'flex-end');
        this.renderer.setStyle(this.rightAction, 'paddingRight', '20px');
        this.renderer.setStyle(this.rightAction, 'fontSize', '1.5rem');
        this.rightAction.textContent = this.leftActionIcon;

        // Wrap original content
        this.content = this.renderer.createElement('div');
        this.renderer.addClass(this.content, 'swipeable-content');
        this.renderer.setStyle(this.content, 'position', 'relative');
        this.renderer.setStyle(this.content, 'zIndex', '1');
        this.renderer.setStyle(this.content, 'background', 'inherit');
        this.renderer.setStyle(this.content, 'touchAction', 'pan-y');
        this.renderer.setStyle(this.content, 'willChange', 'transform');

        // Move original content into content wrapper
        while (element.firstChild) {
            this.renderer.appendChild(this.content, element.firstChild);
        }

        // Build structure
        this.renderer.appendChild(this.wrapper, this.leftAction);
        this.renderer.appendChild(this.wrapper, this.rightAction);
        this.renderer.appendChild(this.wrapper, this.content);
        this.renderer.appendChild(element, this.wrapper);
    }

    private setupGestures(): void {
        this.gestureService
            .handlePan(this.content)
            .pipe(takeUntil(this.destroy$))
            .subscribe((event) => this.onPan(event));
    }

    private onPan(event: PanEvent): void {
        if (this.isAnimating) return;

        // Only handle horizontal pans
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX) && !this.currentX) {
            return;
        }

        // Clamp the movement
        this.currentX = Math.max(-this.maxSwipe, Math.min(this.maxSwipe, event.deltaX));

        // Apply transform
        this.renderer.setStyle(this.content, 'transform', `translateX(${this.currentX}px)`);

        // Show appropriate action indicator
        if (this.currentX < 0) {
            this.renderer.setStyle(this.rightAction, 'opacity', Math.abs(this.currentX) / this.swipeThreshold);
        } else {
            this.renderer.setStyle(this.leftAction, 'opacity', this.currentX / this.swipeThreshold);
        }

        if (event.isFinal) {
            this.onPanEnd(event);
        }
    }

    private onPanEnd(event: PanEvent): void {
        const shouldTriggerLeft = this.currentX < -this.swipeThreshold || event.velocityX < -0.5;
        const shouldTriggerRight = this.currentX > this.swipeThreshold || event.velocityX > 0.5;

        if (shouldTriggerLeft) {
            this.triggerLeftAction();
        } else if (shouldTriggerRight) {
            this.triggerRightAction();
        } else {
            this.resetPosition();
        }
    }

    private triggerLeftAction(): void {
        this.isAnimating = true;
        this.gestureService.haptic('medium');

        // Animate out
        this.renderer.setStyle(this.content, 'transition', 'transform 0.3s ease');
        this.renderer.setStyle(this.content, 'transform', 'translateX(-100%)');

        setTimeout(() => {
            this.swipeLeft.emit();
            this.isAnimating = false;
        }, 300);
    }

    private triggerRightAction(): void {
        this.isAnimating = true;
        this.gestureService.haptic('medium');

        // Animate out
        this.renderer.setStyle(this.content, 'transition', 'transform 0.3s ease');
        this.renderer.setStyle(this.content, 'transform', 'translateX(100%)');

        setTimeout(() => {
            this.swipeRight.emit();
            this.isAnimating = false;
        }, 300);
    }

    private resetPosition(): void {
        this.isAnimating = true;

        this.renderer.setStyle(this.content, 'transition', 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
        this.renderer.setStyle(this.content, 'transform', 'translateX(0)');
        this.renderer.setStyle(this.leftAction, 'opacity', '0');
        this.renderer.setStyle(this.rightAction, 'opacity', '0');

        setTimeout(() => {
            this.renderer.removeStyle(this.content, 'transition');
            this.currentX = 0;
            this.isAnimating = false;
        }, 300);
    }

    // Public method to reset from outside
    reset(): void {
        this.resetPosition();
    }
}
