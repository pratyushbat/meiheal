// shared/star-rating/star-rating.component.ts
import { Component, input, computed } from '@angular/core';

@Component({
    selector: 'app-star-rating',
    standalone: true,
    template: `
    <div class="flex items-center gap-1" [attr.aria-label]="rating() + ' out of 5 stars'">
      <div class="flex" [class.gap-0.5]="size() !== 'sm'">
        @for (i of [0, 1, 2, 3, 4]; track i) {
          <svg
            [class.w-3.5]="size() === 'sm'"
            [class.h-3.5]="size() === 'sm'"
            [class.w-4]="size() === 'md'"
            [class.h-4]="size() === 'md'"
            [class.w-5]="size() === 'lg'"
            [class.h-5]="size() === 'lg'"
            viewBox="0 0 20 20"
            [class.text-amber-400]="fillLevel(i) > 0"
            [class.text-neutral-200]="fillLevel(i) === 0"
          >
            <defs>
              <linearGradient [attr.id]="'star-fill-' + i + '-' + uid">
                <stop [attr.offset]="(fillLevel(i) * 100) + '%'" stop-color="currentColor" />
                <stop [attr.offset]="(fillLevel(i) * 100) + '%'" stop-color="transparent" />
              </linearGradient>
            </defs>
            <path
              [attr.fill]="'url(#star-fill-' + i + '-' + uid + ')'"
              stroke="currentColor"
              stroke-width="0"
              d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.97l-5.2 2.54.99-5.79-4.21-4.1 5.82-.85L10 1.5z"
            />
          </svg>
        }
      </div>

      @if (showCount() && count() !== undefined) {
        <span
          class="text-neutral-500"
          [class.text-xs]="size() === 'sm'"
          [class.text-sm]="size() !== 'sm'"
        >
          ({{ count() }})
        </span>
      }
    </div>
  `,
})
export class StarRatingComponent {
    rating = input.required<number>();
    count = input<number>();
    size = input<'sm' | 'md' | 'lg'>('md');
    showCount = input(true);

    uid = Math.random().toString(36).slice(2, 8);

    fillLevel(starIndex: number): number {
        const diff = this.rating() - starIndex;
        if (diff >= 1) return 1;
        if (diff <= 0) return 0;
        return diff; // partial fill, e.g. 0.6
    }
}