import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BehaviorSubject, Observable, of} from 'rxjs';
import esriConfig from '@arcgis/core/config';
import { v4 as uuidv4 } from 'uuid';

import {catchError, map, tap} from 'rxjs/operators';

import {environment} from '@environments/environment';
import {
  AGOLService,
  AGOLContentInfo,
  ColumnsRows,
  Project,
  ProjectCentroid,
  ProjectLabResult,
  ProjectSample, ProjectExplorer, FeatureCollection, Feature
} from '../projectInterfaceTypes';


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

  public scribeApiUrl = null;
  public agolUserContentUrl = null;
  public agolUsername = null;
  public agolToken = null;


  constructor(private http: HttpClient, public router: Router, public snackBar: MatSnackBar) {
    // const username = this.loginService.currentUser.value.agol_username;
    this.scribeApiUrl = `${environment.api_url}/${environment.api_version_tag}`;

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

  async getUserExploredProjects() {
    const results = await this.http.get<ProjectExplorer[]>(`${this.scribeApiUrl}/projectsexplorer/`).toPromise()
      .catch((error) => {
        return {} as ColumnsRows;
      });
    return results;
  }

  getUserFilteredProjects(filterValue?: string): Observable<ProjectExplorer[]> {
    return this.http.get<ProjectExplorer[]>(`${this.scribeApiUrl}/projectsexplorer/?search=${filterValue}`);
  }

  async addItemToAGOL(agolContentInfo: AGOLContentInfo): Promise<boolean | string> {
    let result = false;
    const geoJson = await this.generateGeoJson(agolContentInfo);
    if (geoJson) {
      const url = `${this.agolUserContentUrl}/addItem`;
      const formData = new FormData();
      const geojsonFile = new Blob([geoJson], {type: 'application/geo+json'});
      formData.append('type', 'GeoJson');
      formData.append('title', agolContentInfo.title);
      formData.append('description', agolContentInfo.description);
      formData.append('file', geojsonFile, uuidv4());
      formData.append('tags', 'Scribe Explorer');
      // formData.append('multipart', 'true');
      // formData.append('filename', data.title);
      formData.append('token', this.agolToken);
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

  // Generate the geojson from the backend
  // async generateGeoJson(data) {
  //   const fileResult = await this.http.post<any>(`${this.scribeApiUrl}/generate_geojson/`, data).toPromise().then((file) => {
  //     return file;
  //   }).catch((error) => {
  //     this.snackBar.open(`Error publishing GeoPlatform service: Error creating GeoJson file.`, null, {
  //       duration: 3000, panelClass: ['snackbar-error']
  //     });
  //     return false;
  //   });
  //   return fileResult;
  // }

  // Generate the geojson from the frontend
  generateGeoJson(data) {
    const featureCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features: []
    };
    data.rows.forEach(row => {
      const feature: Feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: []
        },
        properties: {}
      };
      feature.geometry.coordinates = [row.Longitude, row.Latitude];
      feature.properties = row;
      featureCollection.features.push(feature);
    });
    if (featureCollection.features.length) {
      return JSON.stringify(featureCollection);
    } else {
      return '';
    }
  }

  async publishToAGOL(agolContentInfo: AGOLContentInfo) {
    const itemId = await this.addItemToAGOL(agolContentInfo);
    if (itemId) {
      const publishParameters = JSON.stringify({
        name: itemId as string,
        description: agolContentInfo.description
      });
      const url = `${this.agolUserContentUrl}/publish`;
      const formData = new FormData();
      formData.append('itemId', itemId as string);
      formData.append('fileType', 'geojson');
      formData.append('publishParameters', publishParameters);
      formData.append('token', this.agolToken);
      formData.append('f', 'json');
      const result = await this.http.post<any>(url, formData).toPromise().then((response) => {
        // console.log(response);
        if ('error' in response) {
          this.snackBar.open(`Error publishing GeoPlatform service: ${response.error.message}`, null, {
            duration: 3000, panelClass: ['snackbar-error']
          });
          return false;
        } else {
          if ('services' in response && response.services[0].success === false) {
            this.snackBar.open(`Error publishing GeoPlatform service: ${response.services[0].error.message}`, null, {
              duration: 3000, panelClass: ['snackbar-error']
            });
            return false;
          }
          const successSnack = this.snackBar.open('Successfully Publish', 'Click to open', {
            duration: null,
            panelClass: ['snackbar-success']
          });
          successSnack.onAction().subscribe(() => window.open(
            `${environment.user_geo_platform_url}/home/item.html?id=${itemId}`,
            '_blank'
          ));
          setTimeout(() => this.getPublishedAGOLServices(), 10000);
          return true;
        }
      }).catch((error) => {
        this.snackBar.open(`Error publishing GeoPlatform service.`, null, {
          duration: 3000, panelClass: ['snackbar-error']
        });
        return error.message;
      });
      // delete added item
      // const deleteItemUrl = `${this.agolUserContentUrl}/deleteItems?items=${itemId}&token=${this.agolToken}&f=json`;
      // const deleteResult = await this.http.post<any>(deleteItemUrl, {}).toPromise().then((response) => {
      //   return response.results[0].success;
      // });

      return result;
    }
  }

  getPublishedAGOLServices() {
    const agolServices = [];
    const url = `${environment.user_geo_platform_url}/sharing/rest/search`;
    const params = {
      token: this.agolToken,
      f: 'json',
      filter: '(tags:("scribe explorer") and type:("Feature Service"))',
      q: `(owner: "${this.agolUsername}")`
    };
    return this.http.get<any>(url, {params}).pipe(
      map(r => r.results.map(i => {
        i.itemUrl = `${environment.user_geo_platform_url}/home/item.html?id=${i.id}`;
        return i;
      })),
      tap(r => this.userAGOLServices.next(r)),
      catchError(e => of(e))
    );
      // .catch((error) => {
      //   return false;
      // });
    // if (results) {
    //   for (const item of results.items) {
    //     // if (item.tags.includes('Scribe Explorer')) {
    //       agolServices.push({
    //         title: item.title,
    //         url: `${environment.user_geo_platform_url}/home/item.html?id=${item.id}`
    //       });
    //     // }
    //   }
    // }
    // return agolServices;
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

  getProjects(projectIds: string[]): Observable<ProjectExplorer[]> {
    return this.http.get<ProjectExplorer[]>(
      `${this.scribeApiUrl}/projectsexplorer/`,
      {params: {projectids: projectIds.join(',')}}
    );
  }
}
