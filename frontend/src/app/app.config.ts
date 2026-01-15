import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // 🔥 YE LINE SUBJECT DROPDOWN FIX KARTI HAI
    provideNoopAnimations(),

    provideHttpClient(
   
      withInterceptors([authInterceptor])
    )
  ]
};
