import {Injectable, Injector} from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpXsrfTokenExtractor
} from '@angular/common/http';
import {Router} from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

import {environment} from '@environments/environment';


@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(private injector: Injector, public router: Router, public dialog: MatDialog,
              private tokenExtractor: HttpXsrfTokenExtractor) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headerName = 'X-CSRFToken';
    const token = this.tokenExtractor.getToken() as string;
    if (request.url.includes(environment.geo_platform_url) || request.url.includes(environment.user_geo_platform_url)) {
      // don't include CSRF token (not allowed by geo_platform api)
      request = request.clone({
        url: request.url
      });
    } else {
      request = request.clone({
        headers: token ? request.headers.set(headerName, token) : request.headers,
        url: `${request.url}`,
        withCredentials: true
      });
    }

    return next.handle(request).pipe(
      tap(event => {
        },
        err => {
          if (err instanceof HttpErrorResponse && err.status === 401) {
            this.dialog.closeAll();
            if (!this.router.url.includes('/login')) {
              this.router.navigate(['/login'], {queryParams: {next: this.router.url}});
            }
          }
        }));
  }
}
