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
  samplesLoaded = false;
  mapNumOfFeatures = 1;
  selectedProject: string;
  tabs: any = {0: 'Field Sample Points', 1: 'Analyte Results'};
  selectedTab = 0;
  userProjects: Project[];
  projectSamplesColDefs: any[];
  projectSamplesRowData: ProjectSample[] = [];

  constructor(public app: AppComponent,
              public loginService: LoginService,
              public sadieProjectsService: SadieProjectsService) {
    this.projectsLoaded = false;
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

  async getProjectData(selectedProjectId) {
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

  async onTabChange(tabId) {
    this.selectedTab = tabId;
    if (this.tabs[this.selectedTab] === 'Field Sample Points') {
      const results = await this.sadieProjectsService.getProjectSamples(this.selectedProject);
      this.projectSamplesColDefs = results.columnDefs;
      this.projectSamplesRowData = results.rowData;
    }
  }
}
