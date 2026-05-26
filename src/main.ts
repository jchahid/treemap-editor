import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

registerLocaleData(localeFr);

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
  ],
}).catch(err => console.error(err));
