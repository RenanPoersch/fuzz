import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { HashLocationStrategy, LocationStrategy, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AppShellComponent } from './app/app-shell.component';
registerLocaleData(localePt);
bootstrapApplication(AppShellComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
  ],
}).catch(console.error);
