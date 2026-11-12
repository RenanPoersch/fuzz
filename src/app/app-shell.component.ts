import { Location } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { AppComponent } from './app.component';
import { TrainingPageComponent } from './training-page.component';

@Component({
  selector: 'app-root',
  imports: [AppComponent, TrainingPageComponent],
  template: `
    <nav class="page-navigation" aria-label="Páginas do simulador">
      <a href="#/" [attr.aria-current]="onTrainingPage() ? null : 'page'">Demonstração</a>
      <a href="#/treinamento" [attr.aria-current]="onTrainingPage() ? 'page' : null">Treinamento</a>
    </nav>
    <app-demonstration [hidden]="onTrainingPage()" />
    <app-training-page [hidden]="!onTrainingPage()" />
  `,
})
export class AppShellComponent {
  private readonly location = inject(Location);
  protected readonly onTrainingPage = signal(this.location.path() === '/treinamento');

  constructor() {
    const unsubscribe = this.location.onUrlChange(() => {
      const isTraining = this.location.path() === '/treinamento';
      if (isTraining !== this.onTrainingPage()) {
        this.onTrainingPage.set(isTraining);
        window.scrollTo(0, 0);
      }
    });
    inject(DestroyRef).onDestroy(unsubscribe);
  }
}
