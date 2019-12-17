import { Component, OnInit } from '@angular/core';
import {AppComponent} from '../app.component';
import {LoginService} from '../services/login.service';
import {Project, ProjectSample, ProjectLabResult, SadieProjectsService} from '../services/sadie-projects.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  userProjects: Project[];
  projectsLoaded: boolean;
  selectedProject: string;
  tabs: any = {0: 'Field Sample Points', 1: 'Analyte Results'};
  selectedTab = 0;
  isLoadingData = false;
  // sample point props
  samplesLoaded = false;
  numOfGeoSamplePoints = 1;
  projectSamplesColDefs: any[] = [];
  projectSamplesRowData: ProjectSample[] = [];
  // lab result props
  labResultLoaded = false;
  projectLabResultsColDefs: any[] = [];
  projectLabResultsRowData: ProjectLabResult[] = [];

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

  setNumOfGeoFeatures(val) {
    this.numOfGeoSamplePoints = val;
  }

  async getProjectData(selectedProjectId) {
    this.isLoadingData = true;
    if (this.tabs[this.selectedTab] === 'Field Sample Points') {
      try {
        // get project sample data
        const results = await this.sadieProjectsService.getProjectSamples(selectedProjectId);
        this.projectSamplesColDefs = results.columnDefs;
        this.projectSamplesRowData = results.rowData;
        this.samplesLoaded = true;
      } catch (err) {
        this.samplesLoaded = false;
      }
    }
    if (this.tabs[this.selectedTab] === 'Analyte Results') {
      try {
        // get project lab data
        const results = await this.sadieProjectsService.getProjectLabResults(selectedProjectId);
        if (results.length > 0) {
          this.projectLabResultsColDefs = this.setAgGridColumnProps(results);
          this.projectLabResultsRowData = results;
          this.labResultLoaded = true;
        }
      } catch (err) {
        this.labResultLoaded = false;
      }
    }
    this.isLoadingData = false;
  }

  async onTabChange(tabId) {
    this.isLoadingData = true;
    this.selectedTab = tabId;
    if (this.selectedProject && this.tabs[this.selectedTab] === 'Field Sample Points') {
      try {
        const results = await this.sadieProjectsService.getProjectSamples(this.selectedProject);
        this.projectSamplesColDefs = results.columnDefs;
        this.projectSamplesRowData = results.rowData;
        this.samplesLoaded = true;
      } catch (err) {
        this.samplesLoaded = false;
      }
    }
    if (this.selectedProject && this.tabs[this.selectedTab] === 'Analyte Results') {
      try {
        const results = await this.sadieProjectsService.getProjectLabResults(this.selectedProject);
        if (results.length > 0) {
          this.projectLabResultsColDefs = this.setAgGridColumnProps(results);
          this.projectLabResultsRowData = results;
          this.labResultLoaded = true;
        }
      } catch (err) {
        this.labResultLoaded = false;
      }
    }
    this.isLoadingData = false;
  }

  setAgGridColumnProps(results) {
    const columnDefs = [];
    Object.keys(results[0]).forEach((key) => {
      columnDefs.push({headerName: key, field: key, sortable: true, filter: true});
    });
    return columnDefs;
  }

}
