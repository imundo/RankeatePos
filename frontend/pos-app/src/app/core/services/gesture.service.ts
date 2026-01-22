import { Injectable, inject, NgZone } from '@angular/core';
import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';

// ============================================
// GESTURE TYPES
// ============================================

export interface SwipeEvent {
    direction: 'left' | 'right' | 'up' | 'down';
    velocity: number;
    distance: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export interface PanEvent {
    deltaX: number;
    deltaY: number;
    velocityX: number;
    velocityY: number;
    isFinal: boolean;
    isFirst: boolean;
}

export interface GestureConfig {
    swipeThreshold?: number;      // Minimum distance for swipe (px)
    swipeVelocity?: number;       // Minimum velocity for swipe (px/ms)
    panThreshold?: number;        // Minimum distance before pan starts
}

const DEFAULT_CONFIG: GestureConfig = {
    swipeThreshold: 50,
    swipeVelocity: 0.3,
    panThreshold: 10,
};

// ============================================
// GESTURE SERVICE
// ============================================

@Injectable({ providedIn: 'root' })
export class GestureService {
    private ngZone = inject(NgZone);
    private destroy$ = new Subject<void>();

    // ============================================
    // SWIPE DETECTION
    // ============================================

    /**
     * Detect swipe gestures on an element
     * @param element Target HTML element
     * @param config Optional gesture configuration
     */
    detectSwipe(element: HTMLElement, config: GestureConfig = {}): Observable<SwipeEvent> {
        const cfg = { ...DEFAULT_CONFIG, ...config };
        const swipe$ = new Subject<SwipeEvent>();

        let startX = 0;
        let startY = 0;
        let startTime = 0;

        this.ngZone.runOutsideAngular(() => {
            element.addEventListener('pointerdown', (e: PointerEvent) => {
                startX = e.clientX;
                startY = e.clientY;
                startTime = Date.now();
                element.setPointerCapture(e.pointerId);
            }, { passive: true });

            element.addEventListener('pointerup', (e: PointerEvent) => {
                const endX = e.clientX;
                const endY = e.clientY;
                const endTime = Date.now();

                const deltaX = endX - startX;
                const deltaY = endY - startY;
                const duration = endTime - startTime;

                const distanceX = Math.abs(deltaX);
                const distanceY = Math.abs(deltaY);
                const velocityX = distanceX / duration;
                const velocityY = distanceY / duration;

                // Determine if it's a horizontal or vertical swipe
                const isHorizontal = distanceX > distanceY;
                const distance = isHorizontal ? distanceX : distanceY;
                const velocity = isHorizontal ? velocityX : velocityY;

                // Check if it meets swipe criteria
                if (distance >= cfg.swipeThreshold! && velocity >= cfg.swipeVelocity!) {
                    let direction: SwipeEvent['direction'];

                    if (isHorizontal) {
                        direction = deltaX > 0 ? 'right' : 'left';
                    } else {
                        direction = deltaY > 0 ? 'down' : 'up';
                    }

                    this.ngZone.run(() => {
                        swipe$.next({
                            direction,
                            velocity,
                            distance,
                            startX,
                            startY,
                            endX,
                            endY,
                        });
                    });
                }

                element.releasePointerCapture(e.pointerId);
            }, { passive: true });
        });

        return swipe$.asObservable();
    }

    // ============================================
    // PAN/DRAG HANDLING
    // ============================================

    /**
     * Handle pan/drag gestures on an element
     * @param element Target HTML element
     * @param config Optional gesture configuration
     */
    handlePan(element: HTMLElement, config: GestureConfig = {}): Observable<PanEvent> {
        const cfg = { ...DEFAULT_CONFIG, ...config };
        const pan$ = new Subject<PanEvent>();

        let startX = 0;
        let startY = 0;
        let lastX = 0;
        let lastY = 0;
        let lastTime = 0;
        let isActive = false;
        let hasPassed = false;

        this.ngZone.runOutsideAngular(() => {
            element.addEventListener('pointerdown', (e: PointerEvent) => {
                startX = e.clientX;
                startY = e.clientY;
                lastX = startX;
                lastY = startY;
                lastTime = Date.now();
                isActive = true;
                hasPassed = false;
                element.setPointerCapture(e.pointerId);
            }, { passive: true });

            element.addEventListener('pointermove', (e: PointerEvent) => {
                if (!isActive) return;

                const currentX = e.clientX;
                const currentY = e.clientY;
                const currentTime = Date.now();

                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                const timeDelta = currentTime - lastTime;

                // Check if pan threshold passed
                if (!hasPassed) {
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    if (distance < cfg.panThreshold!) return;
                    hasPassed = true;
                }

                const velocityX = timeDelta > 0 ? (currentX - lastX) / timeDelta : 0;
                const velocityY = timeDelta > 0 ? (currentY - lastY) / timeDelta : 0;

                lastX = currentX;
                lastY = currentY;
                lastTime = currentTime;

                this.ngZone.run(() => {
                    pan$.next({
                        deltaX,
                        deltaY,
                        velocityX,
                        velocityY,
                        isFinal: false,
                        isFirst: !hasPassed,
                    });
                });
            }, { passive: true });

            const endPan = (e: PointerEvent) => {
                if (!isActive) return;
                isActive = false;

                const currentX = e.clientX;
                const currentY = e.clientY;
                const currentTime = Date.now();
                const timeDelta = currentTime - lastTime;

                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                const velocityX = timeDelta > 0 ? (currentX - lastX) / timeDelta : 0;
                const velocityY = timeDelta > 0 ? (currentY - lastY) / timeDelta : 0;

                this.ngZone.run(() => {
                    pan$.next({
                        deltaX,
                        deltaY,
                        velocityX,
                        velocityY,
                        isFinal: true,
                        isFirst: false,
                    });
                });

                element.releasePointerCapture(e.pointerId);
            };

            element.addEventListener('pointerup', endPan, { passive: true });
            element.addEventListener('pointercancel', endPan, { passive: true });
        });

        return pan$.asObservable();
    }

    // ============================================
    // HAPTIC FEEDBACK
    // ============================================

    /**
     * Trigger haptic feedback (vibration) if supported
     * @param type Intensity of the haptic feedback
     */
    haptic(type: 'light' | 'medium' | 'heavy' = 'light'): void {
        if (!('vibrate' in navigator)) return;

        const patterns: Record<typeof type, number | number[]> = {
            light: 10,
            medium: 25,
            heavy: [30, 10, 30],
        };

        try {
            navigator.vibrate(patterns[type]);
        } catch {
            // Vibration not available or blocked
        }
    }

    // ============================================
    // PULL-TO-REFRESH
    // ============================================

    /**
     * Implement pull-to-refresh pattern
     * @param container Scrollable container element
     * @param threshold Distance to pull before triggering refresh (px)
     */
    pullToRefresh(container: HTMLElement, threshold = 80): Observable<void> {
        const refresh$ = new Subject<void>();

        let startY = 0;
        let isPulling = false;

        this.ngZone.runOutsideAngular(() => {
            container.addEventListener('touchstart', (e: TouchEvent) => {
                // Only activate when at top of scroll
                if (container.scrollTop === 0) {
                    startY = e.touches[0].clientY;
                    isPulling = true;
                }
            }, { passive: true });

            container.addEventListener('touchmove', (e: TouchEvent) => {
                if (!isPulling) return;

                const currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY;

                // Visual feedback (you can add a CSS class or transform)
                if (pullDistance > 0 && pullDistance <= threshold * 1.5) {
                    container.style.transform = `translateY(${Math.min(pullDistance * 0.5, threshold)}px)`;
                }
            }, { passive: true });

            container.addEventListener('touchend', (e: TouchEvent) => {
                if (!isPulling) return;
                isPulling = false;

                const endY = e.changedTouches[0].clientY;
                const pullDistance = endY - startY;

                // Reset transform
                container.style.transition = 'transform 0.3s ease';
                container.style.transform = '';

                setTimeout(() => {
                    container.style.transition = '';
                }, 300);

                // Trigger refresh if threshold met
                if (pullDistance >= threshold) {
                    this.haptic('medium');
                    this.ngZone.run(() => {
                        refresh$.next();
                    });
                }
            }, { passive: true });
        });

        return refresh$.asObservable();
    }

    // ============================================
    // CLEANUP
    // ============================================

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
