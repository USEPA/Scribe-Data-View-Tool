import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {BehaviorSubject, Observable} from 'rxjs';
import {ColumnsRows, Project, ProjectCentroid, ProjectLabResult, ProjectSample} from '../projectInterfaceTypes';


@Injectable({
  providedIn: 'root'
})
export class ScribeDataExplorerService {
  public projectCentroidsSelectedSource: BehaviorSubject<ProjectCentroid[]> = new BehaviorSubject<ProjectCentroid[]>(null);
  public projectCentroidsSelectedEvent: Observable<ProjectCentroid[]> = this.projectCentroidsSelectedSource.asObservable();
  public mapPointSelectedSource: BehaviorSubject<ProjectSample> = new BehaviorSubject<ProjectSample>(null);
  public mapPointSelectedChangedEvent: Observable<ProjectSample> = this.mapPointSelectedSource.asObservable();
  public mapPointsSelectedSource: BehaviorSubject<ProjectSample[]> = new BehaviorSubject<ProjectSample[]>(null);
  public mapPointsSelectedChangedEvent: Observable<ProjectSample[]> = this.mapPointsSelectedSource.asObservable();
  public mdlValueSource: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public mdlValueChangedEvent: Observable<any> = this.mdlValueSource.asObservable();
  public mapPointsSymbolizationSource: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public mapPointsSymbolizationChangedEvent: Observable<any> = this.mapPointsSymbolizationSource.asObservable();
  public mapSymbolFieldAliases = ['Matrix', 'Analyte', 'MDL'];

  constructor(private http: HttpClient, public router: Router) {
  }

  async getUserProjects() {
    return await this.http.get<Project[]>('projects').toPromise();
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
