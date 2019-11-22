import {Injectable, Injector} from '@angular/core';
import {HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse} from "@angular/common/http";
import {Observable} from "rxjs/Observable";

import {LoginService} from "./login.service";

import {tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {environment} from '../environments/environment';
import {MatDialog} from '@angular/material';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(private injector: Injector, public router: Router, public dialog: MatDialog) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const loginService = this.injector.get(LoginService);
    if (request.url.indexOf(environment.local_service_endpoint) === 0) {
      const auth_header = loginService.access_token ? {Authorization: `Bearer ${loginService.access_token}`} : {};
      request = request.clone({
        setHeaders: auth_header
      });
    }

    return next.handle(request).pipe(
      tap(event => {
        },
        err => {
          if (err instanceof HttpErrorResponse && err.status === 401) {
            loginService.clearToken();
            this.dialog.closeAll(); // to make sure they are not left open after navigation to login page.
            this.router.navigate(['/login'], {queryParams: {next: window.location.pathname}});
          }
        }));
  }
}
