import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IdlePreloadingStrategy implements PreloadingStrategy {
    private queue: Array<() => void> = [];
    private running = false;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    preload(route: Route, load: () => Observable<any>): Observable<any> {
        if (!isPlatformBrowser(this.platformId)) return EMPTY;
        if (!(route.data && route.data['preload'] === true)) return EMPTY;

        return new Observable((subscriber) => {
            const task = () => {
                load().subscribe({
                    next: (v) => subscriber.next(v),
                    error: (e) => {
                        subscriber.error(e);
                        this.running = false;
                        this.next(); // advance queue after this one finishes
                    },
                    complete: () => {
                        subscriber.complete();
                        this.running = false;
                        this.next(); // advance queue after this one finishes
                    },
                });
            };

            this.queue.push(task);
            this.next();

            return () => {
                this.queue = this.queue.filter(t => t !== task);
            };
        });
    }

    private next() {
        if (this.running) return;        // already processing one — don't start another
        if (this.queue.length === 0) return;

        this.running = true;             // claim the lane BEFORE scheduling, not inside the task
        const task = this.queue.shift()!;
        const win = window as any;

        const kickoff = () => {
            if (typeof win.requestIdleCallback === 'function') {
                win.requestIdleCallback(task, { timeout: 5000 });
            } else {
                setTimeout(task, 3000);
            }
        };

        if (document.readyState === 'complete') {
            kickoff();
        } else {
            window.addEventListener('load', kickoff, { once: true });
        }
    }
}