import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';

export interface Project {
  projectid: number;
  project_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class SadieProjectsService {

  constructor(private http: HttpClient, public router: Router) {}

  async getUserProjects() {
    return await this.http.get<Project[]>('projects').toPromise();
  }

}
