import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BehaviorSubject, Observable} from 'rxjs';
import esriConfig from 'esri/config';

import {environment} from '@environments/environment';
import {
  AGOLService,
  ColumnsRows,
  Project,
  ProjectCentroid,
  ProjectLabResult,
  ProjectSample
} from '../projectInterfaceTypes';
import {LoginService} from '../auth/login.service';



@Injectable({
  providedIn: 'root'
})
export class ScribeDataExplorerService {
  public userAGOLServices: BehaviorSubject<AGOLService[]> = new BehaviorSubject<AGOLService[]>(null);
  public isPublishingToAGOL: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public projectCentroidsSelectedSource: BehaviorSubject<ProjectCentroid[]> = new BehaviorSubject<ProjectCentroid[]>(null);
  public projectCentroidsSelectedEvent: Observable<ProjectCentroid[]> = this.projectCentroidsSelectedSource.asObservable();
  public mapPointSelectedSource: BehaviorSubject<ProjectSample> = new BehaviorSubject<ProjectSample>(null);
  public mapPointSelectedChangedEvent: Observable<ProjectSample> = this.mapPointSelectedSource.asObservable();
  public mapPointsSelectedSource: BehaviorSubject<ProjectSample[]> = new BehaviorSubject<ProjectSample[]>(null);
  public mapPointsSelectedChangedEvent: Observable<ProjectSample[]> = this.mapPointsSelectedSource.asObservable();
  public clearMapSelectionSource: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  public clearMapSelectionEvent: Observable<boolean> = this.clearMapSelectionSource.asObservable();
  public mdlValueSource: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public mdlValueChangedEvent: Observable<any> = this.mdlValueSource.asObservable();
  public mapPointsSymbolizationSource: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public mapPointsSymbolizationChangedEvent: Observable<any> = this.mapPointsSymbolizationSource.asObservable();
  public mapSymbolFieldAliases = ['Matrix', 'Analyte', 'MDL'];

  scribeApiUrl = null;
  agolUserContentUrl = null;

  constructor(private http: HttpClient, public router: Router, public loginService: LoginService,
              public snackBar: MatSnackBar) {
    const username = this.loginService.currentUser.value.agol_username;
    this.scribeApiUrl = `${environment.api_url}/${environment.api_version_tag}`;
    this.agolUserContentUrl = `https://epa.maps.arcgis.com/sharing/rest/content/users/${username}`;

    esriConfig.request.trustedServers.push(environment.agol_trusted_server);
    esriConfig.request.proxyRules.push({
      urlPrefix: environment.agol_proxy_url_prefix,
      proxyUrl: environment.agol_proxy_url
    });
  }

  async getUserProjects() {
    const results = await this.http.get<Project[]>(`${this.scribeApiUrl}/projects/`).toPromise()
      .catch((error) => {
        return {} as ColumnsRows;
      });
    return results;
  }

  async addItemToAGOL(data) {
    let result = false;
    const geoJson = await this.generateGeoJson(data);
    if (geoJson) {
      const url = `${this.agolUserContentUrl}/addItem`;
      const formData = new FormData();
      const geojsonFile = new Blob([geoJson], { type: 'application/geo+json' });
      formData.append('type', 'GeoJson');
      formData.append('title', data.title);
      formData.append('file', geojsonFile, data.title);
      formData.append('tags', 'Scribe Explorer');
      // formData.append('multipart', 'true');
      // formData.append('filename', data.title);
      formData.append('token', this.loginService.currentUser.value.agol_token);
      formData.append('f', 'json');
      result = await this.http.post<any>(url, formData).toPromise().then((response) => {
        if ('error' in response) {
          this.snackBar.open(`Error publishing GeoPlatform service: ${response.error.message}`, null, {
            duration: 3000, panelClass: ['snackbar-error']
          });
          return false;
        } else {
          // return added item id
          return response.id;
        }
      }).catch((error) => {
        this.snackBar.open(`Error publishing GeoPlatform service.`, null, {
          duration: 3000, panelClass: ['snackbar-error']
        });
        return false;
      });

    }
    return result;
  }

  async generateGeoJson(data) {
    const fileResult = await this.http.post<any>(`${this.scribeApiUrl}/generate_geojson_file/`, data).toPromise().then((file) => {
      return file;
    }).catch((error) => {
      this.snackBar.open(`Error publishing GeoPlatform service: Error creating GeoJson file.`, null, {
        duration: 3000, panelClass: ['snackbar-error']
      });
      return false;
    });
    return fileResult;
  }

  async publishToAGOL(data) {
    const itemId = await this.addItemToAGOL(data);
    if (itemId) {
      const publishParams = JSON.stringify({name: data.title, description: 'Scribe Explorer generated feature layer'});
      const url = `${this.agolUserContentUrl}/publish?itemId=${itemId}&fileType=geojson&publishParameters=${publishParams}&token=${this.loginService.currentUser.value.agol_token}&f=json`;
      const result = await this.http.post<any>(url, {}).toPromise().then((response) => {
        // console.log(response);
        if ('error' in response) {
          this.snackBar.open(`Error publishing GeoPlatform service: ${response.error.message}`, null, {
            duration: 3000, panelClass: ['snackbar-error']
          });
          return false;
        } else {
          if ('success' in response && response.success === false) {
            this.snackBar.open(`Error publishing GeoPlatform service: ${response.error.message}`, null, {
              duration: 3000, panelClass: ['snackbar-error']
            });
            return false;
          }
          this.snackBar.open(`AGOL Service published.`, null, {
            duration: 3000, panelClass: ['snackbar-success']
          });
          return true;
        }
      }).catch((error) => {
        this.snackBar.open(`Error publishing GeoPlatform service.`, null, {
          duration: 3000, panelClass: ['snackbar-error']
        });
        return error.message;
      });
      // delete added item
      const deleteItemUrl = `${this.agolUserContentUrl}/deleteItems?items=${itemId}&token=${this.loginService.currentUser.value.agol_token}&f=json`;
      const deleteResult = await this.http.post<any>(deleteItemUrl, {}).toPromise().then((response) => {
        return response.results[0].success;
      });

      return result;
    }
  }

  async getPublishedAGOLServices() {
    const agolServices = [];
    const url = `${this.agolUserContentUrl}?token=${this.loginService.currentUser.value.agol_token}&f=json`;
    const results = await this.http.get<any>(url).toPromise()
      .catch((error) => {
        return false;
      });
    if (results) {
      for (const item of results.items) {
        if (item.tags.includes('Scribe Explorer')) {
          agolServices.push({title: item.title, url: `${environment.geo_platform_url}/home/item.html?id=${item.id}`});
        }
      }
    }
    return agolServices;
  }

  async getProjectSamples(projectId: string) {
    const results: ColumnsRows = await this.http.get<ColumnsRows>(`${this.scribeApiUrl}/projects/PID_${projectId}/samples/`).toPromise()
      .catch((error) => {
        console.log(error.message);
        return {} as ColumnsRows;
      });
    return results.rowData;
  }

  async getProjectLabResults(projectId: string) {
    const results = await this.http.get<ProjectLabResult[]>(`${this.scribeApiUrl}/PID_${projectId}/PID_${projectId}_LabResults/`).toPromise()
      .catch((error) => {
        console.log(error.message);
        return [];
      });
    return results;
  }

}
