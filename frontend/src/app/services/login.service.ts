import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Router, ActivatedRouteSnapshot, CanActivateChild, RouterStateSnapshot, CanActivate} from '@angular/router';
import {environment} from '../../environments/environment';


@Injectable()
export class LoginService implements CanActivateChild, CanActivate {
  access_token;
  token_expires: Date;
  username: string;
  // display_name: string;
  client_id: string;
  response_type: string;
  redirect_uri: string;
  local_client_id: string;
  oauth_url: string;
  esri_token_object: any;
  // groups: string[];
  // permissions: string[];
  // is_superuser: boolean;

  constructor(private http: HttpClient, private router: Router) {
    this.client_id = environment.oauth_client_id;
    this.response_type = environment.oauth_response_type;
    this.redirect_uri = environment.oauth_redirect_uri;
    this.local_client_id = environment.local_client_id;
    this.oauth_url = environment.oauth_url;
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return new Promise(resolve => {

      this.loadToken().pipe(
        tap(() => resolve(true)),
        catchError(() => this.router.navigate(['login'], {queryParams: {next: window.location.pathname}}))
      ).subscribe();

    });
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return new Promise(resolve => {

      this.loadToken().pipe(
        tap(() => resolve(true)
        ),
        catchError(() => this.router.navigate(['login']))
      ).subscribe();

    });
  }

  sendToLogin(next: string = '') {
    const params: object = {
      client_id: this.client_id,
      response_type: this.response_type,
      redirect_uri: `${this.redirect_uri}?next=${next}`,
      expiration: 20160
    };

    const url_params: string[] = Object.keys(params).map(key => key + '=' + params[key]);

    window.location.href = this.oauth_url + '?' + url_params.join('&');
  }

  convertToken(access_token: string, expires_in: string, user_id: string = null) {
    // return forkJoin(
    // this.setEsriToken(access_token, expires_in, user_id),
    return this.http.post(`${environment.local_service_endpoint}/oauth2/convert-token`, '', {
      params: new HttpParams()
        .set('grant_type', 'convert_token')
        .set('client_id', this.local_client_id)
        .set('backend', 'agol')
        .set('token', access_token)
    }).pipe(
      map(response =>
        this.setAccessToken(response['access_token'], response['expires_in']))
    );
    // );
  }

  login(username: string, password: string) {
    const data = {
      username: username,
      password: password
    };
    return this.http.post(`/rest-auth/login/`, data)
      .pipe(
        map(response => this.setAccessToken(response['key'], 3600))
      );
  }


  // setEsriToken(access_token: string, expires_in: string, user_id: string) {
  //   return new Observable(obs => {
  //     loadModules(['esri/identity/IdentityManager', 'esri/identity/OAuthInfo'])
  //       .then(([IdentityManager, OAuthInfo]) => {
  //         const info = new OAuthInfo({
  //           appId: environment.oauth_client_id,
  //           portalUrl: 'https://epa.maps.arcgis.com'
  //         });
  //         IdentityManager.registerOAuthInfos([info]);
  //         this.esri_token_object = {
  //           expires: expires_in,
  //           server: `https://epa.maps.arcgis.com/sharing`,
  //           ssl: true,
  //           token: access_token,
  //           userId: user_id
  //         };
  //         IdentityManager.registerToken(this.esri_token_object);
  //         localStorage.setItem('esri_oauth_token', JSON.stringify(this.esri_token_object));
  //         obs.next();
  //         obs.complete();
  //       });
  //   });
  // }

  setAccessToken(access_token: string, expires_in: number) {
    localStorage.setItem('access_token', access_token);
    this.access_token = access_token;
    const now = new Date().getTime();
    this.token_expires = new Date(now + (expires_in * 1000));
    localStorage.setItem('token_expires', this.token_expires.toISOString());
  }

  loadToken() {
    return new Observable(obs => {
      const expiration_date = String(localStorage.getItem('token_expires'));
      this.token_expires = expiration_date !== 'null' ? new Date(expiration_date) : new Date();
      this.access_token = localStorage.getItem('access_token');
      if (this.access_token) {
        obs.next();
        obs.complete();
      } else {
        obs.error();
      }
    });
  }

  // loadEsriToken() {
  //   this.esri_token_object = JSON.parse(localStorage.getItem('esri_oauth_token'));
  //   return loadModules(['esri/identity/IdentityManager', 'esri/identity/OAuthInfo'])
  //     .then(([IdentityManager, OAuthInfo]) => {
  //       const info = new OAuthInfo({
  //         appId: environment.oauth_client_id,
  //         portalUrl: 'https://epa.maps.arcgis.com'
  //       });
  //       IdentityManager.registerOAuthInfos([info]);
  //       IdentityManager.registerToken(this.esri_token_object);
  //     });
  // }

  isTokenValid() {
    const now = new Date();
    const isValid = (this.token_expires > now);

    return new Promise((resolve, reject) => {
      if (isValid) {
        resolve();
      } else {
        reject();
      }
    });
  }

  clearToken() {
    delete this.token_expires;
    delete this.access_token;
    localStorage.clear();
  }


}
