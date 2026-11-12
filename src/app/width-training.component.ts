import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RATING_HEIGHTS, isRating, parseDecimal } from './training-model';
import { TrainingService } from './training.service';

@Component({
  selector: 'app-width-training',
  imports: [DecimalPipe, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="training-section" aria-labelledby="width-training-title">
      <h2 id="width-training-title">Quanto cada altura combina com “estatura média”?</h2>

      <form [formGroup]="form" (ngSubmit)="includeAssessment()">
        <div class="rating-fields" formArrayName="ratings">
          @for (height of heights; track height; let index = $index) {
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ height | number:'1.2-2' }} m</mat-label>
              <input matInput inputmode="decimal" [formControlName]="index"
                     [attr.aria-invalid]="invalidFields().includes(index)"
                     [attr.aria-describedby]="invalidFields().includes(index) ? 'ratings-error' : null">
            </mat-form-field>
          }
        </div>

        <div class="training-actions">
          <button matButton="tonal" type="submit">Incluir avaliação</button>
          <button matButton="filled" type="button" [disabled]="training.assessmentCount() === 0"
                  (click)="training.fitWidths()">Ajustar curvas</button>
          <span aria-live="polite">
            @if (training.assessmentCount() === 1) {
              1 avaliação incluída
            } @else {
              {{ training.assessmentCount() }} avaliações incluídas
            }
          </span>
        </div>
      </form>

      @if (invalidFields().length > 0) {
        <p id="ratings-error" class="training-error" role="alert">
          Preencha todas as alturas com notas de 0 a 1, com até duas casas decimais.
        </p>
      }

      @if (training.fittedRatings(); as ratings) {
        <div class="training-result" aria-live="polite">
          <p>
            O app ajustou a largura de cada curva para se aproximar das notas médias,
            usando <strong>{{ training.model().center | number:'1.2-4' }} m</strong> como centro.
          </p>
          <table class="training-ratings">
            <thead><tr><th scope="col">Altura</th><th scope="col">Nota média da turma</th></tr></thead>
            <tbody>
              @for (height of heights; track height; let index = $index) {
                <tr>
                  <td>{{ height | number:'1.2-2' }} m</td>
                  <td>{{ ratings[index] | number:'1.2-3' }}</td>
                </tr>
              }
            </tbody>
          </table>
          <a matButton href="#/">Ver curvas na demonstração</a>
        </div>
      }
    </section>
  `,
})
export class WidthTrainingComponent {
  protected readonly training = inject(TrainingService);
  protected readonly invalidFields = signal<number[]>([]);
  protected readonly heights = RATING_HEIGHTS;
  protected readonly form = new FormGroup({
    ratings: new FormArray(this.heights.map(() => {
      return new FormControl('', { nonNullable: true });
    })),
  });

  protected includeAssessment(): void {
    const ratings = this.form.controls.ratings.getRawValue().map((value) => {
      return parseDecimal(value, 2);
    });
    const invalidFields = ratings.flatMap((rating, index) => {
      return isRating(rating) ? [] : [index];
    });
    this.invalidFields.set(invalidFields);
    if (invalidFields.length > 0) {
      return;
    }

    this.training.includeAssessment(ratings);
    this.form.reset();
  }
}
