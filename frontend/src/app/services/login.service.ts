import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {BehaviorSubject, Observable} from 'rxjs';
import {Router, ActivatedRouteSnapshot, CanActivateChild, RouterStateSnapshot, CanActivate} from '@angular/router';

import {environment} from '@environments/environment';


@Injectable()
export class LoginService implements CanActivateChild, CanActivate {
  username: string;
  displayName: string;
  clientId: string;
  localClientId: string;
  oauthUrl: string;
  groups: string[];
  permissions: string[];
  isSuperuser: boolean;


  constructor(private http: HttpClient, private router: Router) {
    this.clientId = environment.oauth_client_id;
    this.localClientId = environment.local_client_id;
    this.oauthUrl = environment.oauth_url;
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return new Promise(resolve => {

      this.loadUser().pipe(tap(() => resolve(true)),
        catchError(() => this.router.navigate(['login']))
      ).subscribe();

    });
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return new Promise(resolve => {

      this.loadUser().pipe(tap(() => resolve(true)),
        catchError(() => this.router.navigate(['login']))
      ).subscribe();

    });
  }

  sendToLogin(next: string = '') {
    window.location.href = `${environment.oauth_url}/login/agol/?next=${next}`;
    // this.http.get(`${environment.oauth_url}/login/agol/?next=${next}`)
    //   .pipe(
    //     map((response) => {
    //       console.log(response);
    //     }),
    //     catchError((error) => {
    //       console.log(error);
    //       return error;
    //     })
    //   ).subscribe();
  }

  async setUser() {
    const response = await this.http.get<any>('current_user').toPromise();
    if (response.name) {
      this.displayName = response.name;
      this.isSuperuser = response.is_superuser;
      localStorage.setItem('display_name', this.displayName);
    }
  }

  loadUser() {
    return new Observable(obs => {
      this.displayName = localStorage.getItem('display_name');
      if (this.displayName) {
        obs.next();
        obs.complete();
      } else {
        obs.error();
      }
    });
  }

  logout() {
    return this.http.get(`${environment.api_url}/auth/logout/`, {responseType: 'text'});
  }

}
