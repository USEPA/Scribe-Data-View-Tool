import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BehaviorSubject, Observable} from 'rxjs';
import {
  AGOLService,
  ColumnsRows,
  Project,
  ProjectCentroid,
  ProjectLabResult,
  ProjectSample
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

  constructor(private http: HttpClient, public router: Router, public snackBar: MatSnackBar) {
  }

  async getUserProjects() {
    const results = await this.http.get<Project[]>('projects').toPromise()
      .catch((error) => {
        return {} as ColumnsRows;
      });
    return results;
  }

  async publishToAGOL(data) {
    const results = await this.http.post<any>('publish_content_to_agol', data).toPromise()
      .then((serviceUrl) => {
        this.snackBar.open(`AGOL Service: ${serviceUrl} published.`, null, {
          duration: 3000, panelClass: ['snackbar-success']
        });
      })
      .catch((error) => {
        this.snackBar.open(`Error publishing GeoPlatform service.`, null, {
          duration: 3000, panelClass: ['snackbar-error']
        });
        return error.message;
      });
    return results;
  }

  async getPublishedAGOLServices() {
    const results = await this.http.get<any>('get_published_agol_services').toPromise()
      .catch((error) => {
        return [];
      });
    return results;
  }

  async getProjectSamples(projectId: string) {
    const results: ColumnsRows = await this.http.get<ColumnsRows>(`projects/PID_${projectId}/samples`).toPromise()
      .catch((error) => {
        console.log(error.message);
        return {} as ColumnsRows;
      });
    return results.rowData;
  }

  async getProjectLabResults(projectId: string) {
    const results = await this.http.get<ProjectLabResult[]>(`PID_${projectId}/PID_${projectId}_LabResults`).toPromise()
      .catch((error) => {
        console.log(error.message);
        return [];
      });
    return results;
  }

}
