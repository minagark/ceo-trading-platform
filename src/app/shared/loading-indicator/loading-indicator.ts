import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-indicator',
  imports: [MatProgressSpinnerModule],
  template: `
    <div role="status" aria-live="polite">
      <mat-spinner [diameter]="40" [attr.aria-label]="label()" />
      <span>{{ label() }}</span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }

    div {
      display: flex;
      min-height: 220px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
  `,
})
export class LoadingIndicator {
  readonly label = input('Loading...');
}
