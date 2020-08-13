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
import {MatDialog} from '@angular/material';
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
    if (!request.url.includes(environment.api_url)) {
      request = request.clone({
        headers: token ? request.headers.set(headerName, token) : request.headers,
        url: `${environment.api_url}/${environment.api_version_tag}/${request.url}/`,
        withCredentials: true
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
