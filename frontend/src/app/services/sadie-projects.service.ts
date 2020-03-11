import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {ColumnsRows, Project, ProjectLabResult} from '../projectDataTypes';


@Injectable({
  providedIn: 'root'
})
export class SadieProjectsService {

  constructor(private http: HttpClient, public router: Router) {
  }

  async getUserProjects() {
    return await this.http.get<Project[]>('projects').toPromise();
  }

  async getProjectSamples(projectId: string) {
    return await this.http.get<ColumnsRows>(`projects/PID_${projectId}/samples`).toPromise()
      .then((colsRows) => {
        return colsRows.rowData;
      }).catch((error) => {
        return [];
      });
  }

  async getProjectLabResults(projectId: string) {
    return await this.http.get<ProjectLabResult[]>(`PID_${projectId}/PID_${projectId}_LabResults`).toPromise()
      .then((results) => {
        return results;
      }).catch((error) => {
        return [];
      });
  }

}
