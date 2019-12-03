import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import DateTimeFormat = Intl.DateTimeFormat;

export interface Project {
  projectid: number;
  project_name: string;
}

export interface ProjectSample {
  samp_no: string;
  sampleDate: Date;
  sampleType: string;
  site_no: string;
  site_name: string;
  area: string;
  site_state: string;
  epaRegionNumber: number;
  contractor: string;
  location: string;
  locationDescription: string;
  latitude: number;
  longitude: number;
}

export interface ColumnsRows {
  columnDefs: any[];
  rowData: any[];
}

@Injectable({
  providedIn: 'root'
})
export class SadieProjectsService {

  constructor(private http: HttpClient, public router: Router) {}

  async getUserProjects() {
    return await this.http.get<Project[]>('projects').toPromise();
  }

  async getProjectSamples(projectId: string) {
    return await this.http.get<ColumnsRows>(`projects/PID_${projectId}/samples`).toPromise();
  }

}
