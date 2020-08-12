import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';
import {Router, ActivatedRouteSnapshot, CanActivateChild, RouterStateSnapshot, CanActivate} from '@angular/router';

import {environment} from '@environments/environment';

export interface User {
  id: number;
  name: string;
  permissions: string[];
  is_superuser: boolean;
}

@Injectable()
export class LoginService implements CanActivateChild, CanActivate {
  currentUser: ReplaySubject<User> = new ReplaySubject<User>();
  displayName: string;
  oauthUrl: string;
  groups: string[];
  permissions: string[];
  isSuperuser: boolean;


  constructor(private http: HttpClient, private router: Router) {
    this.oauthUrl = environment.oauth_url;
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return new Promise(resolve => {
      this.checkUser().pipe(tap(() => resolve(true)),
        catchError(() => this.router.navigate(['login']))
      ).subscribe();
    });
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return new Promise(resolve => {
      this.checkUser().pipe(tap(() => resolve(true)),
        catchError(() => this.router.navigate(['login']))
      ).subscribe();
    });
  }

  sendToLogin(next: string = '') {
    window.location.href = `${environment.oauth_url}/login/agol/?next=${next}`;
  }

  checkUser(): Observable<any> {
    return this.http.get(`${environment.api_url}/current_user/`).pipe(
      tap((config) => {
        console.log(config);
        this.currentUser.next(config);
      })
    );
  }

  async setUser() {
    const response = await this.http.get<any>('current_user').toPromise();
    if (response.name) {
      this.displayName = response.name;
      this.isSuperuser = response.is_superuser;
      localStorage.setItem('display_name', this.displayName);
    }
  }

  logout() {
    return this.http.get(`${environment.api_url}/auth/logout/`, {responseType: 'text'});
  }

}
