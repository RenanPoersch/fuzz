import { Component } from '@angular/core';
import { CenterTrainingComponent } from './center-training.component';
import { WidthTrainingComponent } from './width-training.component';

@Component({
  selector: 'app-training-page',
  imports: [CenterTrainingComponent, WidthTrainingComponent],
  template: `
    <main class="training-page">
      <header>
        <h1>Treinamento do modelo</h1>
      </header>
      <app-center-training />
      <app-width-training />
    </main>
  `,
})
export class TrainingPageComponent {}
