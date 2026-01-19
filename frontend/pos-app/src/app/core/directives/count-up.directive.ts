import { Directive, ElementRef, Input, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';

@Directive({
    selector: '[countUp]',
    standalone: true
})
export class CountUpDirective implements OnChanges {
    @Input('countUp') targetValue: number = 0;
    @Input() duration: number = 2000;
    @Input() prefix: string = '';
    @Input() suffix: string = '';

    private currentRequest: number = 0;

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['targetValue']) {
            this.animate();
        }
    }

    private animate(): void {
        const start = 0;
        const end = this.targetValue;
        const startTime = performance.now();

        // Cancel any ongoing animation
        cancelAnimationFrame(this.currentRequest);

        const step = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.duration, 1);

            // Easing function (easeOutExpo)
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const current = Math.floor(start + (end - start) * ease);

            this.renderer.setProperty(this.el.nativeElement, 'textContent', `${this.prefix}${current.toLocaleString()}${this.suffix}`);

            if (progress < 1) {
                this.currentRequest = requestAnimationFrame(step);
            } else {
                // Ensure final value is exact
                this.renderer.setProperty(this.el.nativeElement, 'textContent', `${this.prefix}${end.toLocaleString()}${this.suffix}`);
            }
        };

        this.currentRequest = requestAnimationFrame(step);
    }
}
