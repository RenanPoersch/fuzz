import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { isHeight, parseDecimal } from './training-model';
import { TrainingService } from './training.service';

@Component({
  selector: 'app-center-training',
  imports: [DecimalPipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="training-section" aria-labelledby="center-training-title">
      <h2 id="center-training-title">Qual altura melhor representa “estatura média”?</h2>

      <form class="center-form" (ngSubmit)="includeHeight()">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Altura em metros</mat-label>
          <input matInput name="height" inputmode="decimal" placeholder="1,78"
                 [(ngModel)]="height" (ngModelChange)="invalidHeight.set(false)"
                 [attr.aria-invalid]="invalidHeight()"
                 [attr.aria-describedby]="invalidHeight() ? 'height-error' : null">
        </mat-form-field>
        <button matButton="tonal" type="submit">Incluir</button>
        <button matButton="filled" type="button" [disabled]="training.heights().length === 0"
                (click)="training.calculateCenter()">Calcular média</button>
      </form>

      @if (invalidHeight()) {
        <p id="height-error" class="training-error" role="alert">
          Informe uma altura maior que zero em metros.
        </p>
      }

      @if (training.heights().length > 0) {
        <ul class="height-answers" aria-label="Alturas incluídas">
          @for (answer of training.heights(); track $index) {
            <li>{{ answer | number:'1.2-12' }} m</li>
          }
        </ul>
      }

      <div class="training-result" aria-live="polite">
        @if (training.appliedCenter(); as center) {
          <p>Média aplicada às curvas <strong>{{ center | number:'1.2-4' }} m</strong></p>
        }
      </div>
    </section>
  `,
})
export class CenterTrainingComponent {
  protected readonly training = inject(TrainingService);
  protected readonly invalidHeight = signal(false);
  protected height = '';

  protected includeHeight(): void {
    const height = parseDecimal(this.height);
    if (!isHeight(height)) {
      this.invalidHeight.set(true);
      return;
    }

    this.training.includeHeight(height);
    this.height = '';
    this.invalidHeight.set(false);
  }
}
