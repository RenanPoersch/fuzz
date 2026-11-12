import { DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { SET_LABELS, type Definition, type HeightSet } from './fuzzy-engine';
import { MathEquationComponent } from './math-equation.component';
import { MembershipFormulaComponent } from './membership-formula.component';

@Component({
  selector: 'app-membership-card',
  imports: [DecimalPipe, MatCardModule, MathEquationComponent, MembershipFormulaComponent],
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>{{ definition().name }}</mat-card-title>
        <mat-card-subtitle>{{ definition().parameters }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <svg viewBox="0 0 420 215" role="img" [attr.aria-label]="chartLabel()">
          <path d="M35,30 V170 H385" class="axis"/>
          <path d="M35,100 H385 M35,30 H385" class="grid"/>
          <text x="12" y="34">1</text>
          <text x="0" y="104">0,5</text>
          <text x="14" y="174">0</text>
          <path [attr.d]="area()" class="area"/>
          <path [attr.d]="curve()" class="curve"/>
          <line [attr.x1]="markerX()" y1="20" [attr.x2]="markerX()" y2="170" class="marker"/>
          <circle [attr.cx]="markerX()" [attr.cy]="170 - value() * 140" r="4" class="point"/>
          <text x="35" y="192">{{ minHeight() | number:'1.2-3' }} m</text>
          <text x="210" y="192" text-anchor="middle">{{ midpoint() | number:'1.2-3' }}</text>
          <text x="385" y="192" text-anchor="end">{{ maxHeight() | number:'1.2-3' }} m</text>
          <text [attr.x]="markerX()" y="210" text-anchor="middle" class="marker-label">{{ height() | number:'1.2-3' }}</text>
        </svg>
        <app-math-equation
          class="membership-degree"
          [showFunction]="true"
          [setLabel]="setLabel()"
          [height]="height()"
          [result]="degree()"
        />
        <p class="description">{{ definition().description }}</p>
        <app-membership-formula [shape]="definition().id" [set]="set()" />
      </mat-card-content>
    </mat-card>
  `,
})
export class MembershipCardComponent {
  readonly definition = input.required<Definition>();
  readonly set = input.required<HeightSet>();
  readonly height = input.required<number>();
  readonly minHeight = input.required<number>();
  readonly maxHeight = input.required<number>();
  readonly curve = input.required<string>();
  readonly markerX = input.required<number>();
  readonly value = input.required<number>();
  readonly degree = input.required<string>();

  protected readonly setLabel = computed(() => {
    return SET_LABELS[this.set()];
  });
  protected readonly area = computed(() => {
    return `${this.curve()} L385,170 L35,170 Z`;
  });
  protected readonly midpoint = computed(() => {
    return this.minHeight() + (this.maxHeight() - this.minHeight()) / 2;
  });
  protected readonly chartLabel = computed(() => {
    const height = this.height().toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    });
    return `Função ${this.definition().name} para estatura ${this.setLabel()}, com marcador em ${height} m`;
  });
}
