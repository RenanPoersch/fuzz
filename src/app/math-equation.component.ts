import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';

type Operand = string | number;
type Difference = readonly [minuend: Operand, subtrahend: Operand];

export type EquationTerm =
  | { kind: 'constant'; value: number }
  | { kind: 'fraction'; numerator: Difference; denominator: Difference | number }
  | { kind: 'gaussian'; height: Operand; center: Operand; sigma: Operand };

export interface EquationCase {
  term: EquationTerm;
  condition: string;
}

@Component({
  selector: 'app-math-equation',
  imports: [DecimalPipe, NgTemplateOutlet],
  templateUrl: './math-equation.component.html',
  styles: `
    :host {
      display: block;
      max-width: 100%;
      overflow-x: auto;
    }

    math {
      width: max-content;
      margin: 0 var(--equation-inline-margin, auto);
      padding: 4px 2px;
      font-size: var(--equation-font-size, 21px);
    }

    .equation-condition {
      font-size: 0.8em;
    }

    mtd:last-child {
      text-align: left;
    }

    .equation-result {
      color: var(--mat-sys-primary);
      font-size: var(--equation-result-size, 1em);
      font-weight: 700;
    }
  `,
})
export class MathEquationComponent {
  readonly term = input<EquationTerm | null>(null);
  readonly cases = input<readonly EquationCase[]>([]);
  readonly showFunction = input(false);
  readonly height = input<Operand>('h');
  readonly setLabel = input<string>();
  readonly result = input<string | null>(null);
}
