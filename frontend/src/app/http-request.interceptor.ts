import {Injectable, Injector} from '@angular/core';
import {HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';


import {tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {environment} from '../environments/environment';
import {MatDialog} from '@angular/material';
import {LoginService} from './services/login.service';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(private injector: Injector, public router: Router, public dialog: MatDialog) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const loginService = this.injector.get(LoginService);
    const authHeader = loginService.access_token ? {Authorization: `Bearer ${loginService.access_token}`} : {};
    if (request.url.includes('http') || request.url.includes(environment.local_service_endpoint)) {
      request = request.clone({
        setHeaders: authHeader
      });
    } else {
      request = request.clone({
        url: `${environment.local_service_endpoint}/${environment.api_version_tag}/${request.url}/`,
        setHeaders: authHeader
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
