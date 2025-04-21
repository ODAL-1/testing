import { ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";

import { routes } from "./app.routes";
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from "@angular/platform-browser";
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideAnimations } from "@angular/platform-browser/animations";
import { authInterceptor } from "./interceptors/auth.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        filter: (req) => req.method === "GET",
        includeHeaders: [],
        includePostRequests: false,
        includeRequestsWithAuthHeaders: false,
      }),
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]),
      withInterceptorsFromDi(),
    ),
    provideAnimations(),
  ],
};
