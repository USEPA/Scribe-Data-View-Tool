import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import DateTimeFormat = Intl.DateTimeFormat;

export interface Project {
  projectid: number;
  project_name: string;
}

export interface ProjectSample {
  Area: string;
  Contractor: string;
  EPA_Region: string;
  Lat: number;
  Location: string;
  Location_Desc: string;
  Long: number;
  Sample_Date: string;
  Sample_Number: string;
  Sample_Type: string;
  Site_Name: string;
  Site_Number: string;
  State: string;
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
