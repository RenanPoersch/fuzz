import { Component, computed, input } from '@angular/core';
import type { HeightSet, Shape } from './fuzzy-engine';
import { MathEquationComponent, type EquationCase, type EquationTerm } from './math-equation.component';

const ZERO: EquationTerm = { kind: 'constant', value: 0 };
const ONE: EquationTerm = { kind: 'constant', value: 1 };

const RISING_RAMP: EquationTerm = {
  kind: 'fraction',
  numerator: ['h', 'a'],
  denominator: ['b', 'a'],
};
const GAUSSIAN: EquationTerm = {
  kind: 'gaussian',
  height: 'h',
  center: 'c',
  sigma: 'σ',
};

const TRIANGULAR_CASES: readonly EquationCase[] = [
  {
    term: ZERO,
    condition: 'h ≤ a ou h ≥ c',
  },
  {
    term: RISING_RAMP,
    condition: 'a < h ≤ b',
  },
  {
    term: {
      kind: 'fraction',
      numerator: ['c', 'h'],
      denominator: ['c', 'b'],
    },
    condition: 'b < h < c',
  },
];

const TRAPEZOIDAL_CASES: readonly EquationCase[] = [
  {
    term: ZERO,
    condition: 'h ≤ a ou h ≥ d',
  },
  {
    term: RISING_RAMP,
    condition: 'a < h < b',
  },
  {
    term: ONE,
    condition: 'b ≤ h ≤ c',
  },
  {
    term: {
      kind: 'fraction',
      numerator: ['d', 'h'],
      denominator: ['d', 'c'],
    },
    condition: 'c < h < d',
  },
];

@Component({
  selector: 'app-membership-formula',
  imports: [MathEquationComponent],
  template: `
    <app-math-equation [showFunction]="true" [term]="term()" [cases]="cases()" />
  `,
  styles: `
    :host {
      display: block;
      --equation-font-size: clamp(17px, 1.8vw, 21px);
    }
  `,
})
export class MembershipFormulaComponent {
  readonly shape = input.required<Shape>();
  readonly set = input.required<HeightSet>();

  protected readonly term = computed(() => {
    return this.shape() === 'gaussian' && this.set() === 'medium' ? GAUSSIAN : null;
  });

  protected readonly cases = computed<readonly EquationCase[]>(() => {
    const shape = this.shape();
    const set = this.set();
    if (set === 'medium') {
      if (shape === 'gaussian') {
        return [];
      }
      return shape === 'triangular' ? TRIANGULAR_CASES : TRAPEZOIDAL_CASES;
    }

    const short = set === 'short';
    if (shape === 'gaussian') {
      return [
        {
          term: ONE,
          condition: short ? 'h ≤ c' : 'h ≥ c',
        },
        {
          term: GAUSSIAN,
          condition: short ? 'h > c' : 'h < c',
        },
      ];
    }

    return [
      {
        term: short ? ONE : ZERO,
        condition: 'h ≤ a',
      },
      {
        term: short
          ? { kind: 'fraction', numerator: ['b', 'h'], denominator: ['b', 'a'] }
          : RISING_RAMP,
        condition: 'a < h < b',
      },
      {
        term: short ? ZERO : ONE,
        condition: 'h ≥ b',
      },
    ];
  });
}
