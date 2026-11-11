import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AppComponent } from './app/app.component';
registerLocaleData(localePt);
bootstrapApplication(AppComponent, {providers:[provideZonelessChangeDetection(),{provide:LOCALE_ID,useValue:'pt-BR'}]}).catch(console.error);
