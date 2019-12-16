import { Component, OnInit } from '@angular/core';
import {AppComponent} from '../app.component';
import {LoginService} from '../services/login.service';
import {Project, ProjectSample, SadieProjectsService} from '../services/sadie-projects.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  projectsLoaded: boolean;
  samplesLoaded: boolean;
  mapNumOfFeatures = 1;
  selectedProject: string;
  userProjects: Project[];
  projectSamplesColDefs: any[];
  projectSamplesRowData: ProjectSample[] = [];

  constructor(public app: AppComponent,
              public loginService: LoginService,
              public sadieProjectsService: SadieProjectsService) {
    this.projectsLoaded = false;
    this.samplesLoaded = false;
  }

  async ngOnInit() {
    if (this.loginService.access_token) {
      try {
        this.userProjects = await this.sadieProjectsService.getUserProjects();
        this.projectsLoaded = true;
      } catch (err) {
        this.projectsLoaded = false;
      }

    }
  }

  async projectChanged(selectedProjectId) {
    try {
      const results = await this.sadieProjectsService.getProjectSamples(selectedProjectId);
      this.projectSamplesColDefs = results.columnDefs;
      this.projectSamplesRowData = results.rowData;
      this.samplesLoaded = true;
    } catch (err) {
      this.samplesLoaded = false;
    }
  }

  setMapNumOfFeatures(val) {
    this.mapNumOfFeatures = val;
  }

}
