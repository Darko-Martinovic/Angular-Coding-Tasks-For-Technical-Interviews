import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { AppComponent, routes } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes, withHashLocation())],
}).catch((err) => console.error(err));
