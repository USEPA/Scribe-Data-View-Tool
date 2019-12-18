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
  tabs: any = {0: 'Lab Analyte Results', 1: 'Sample Point Locations'};
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
    try {
      this.isLoadingData = true;
      // get project sample data
      const sampleResults = await this.sadieProjectsService.getProjectSamples(selectedProjectId);
      this.projectSamplesColDefs = sampleResults.columnDefs;
      this.projectSamplesRowData = sampleResults.rowData;
      // get project lab data
      const labResults = await this.sadieProjectsService.getProjectLabResults(selectedProjectId);
      if (labResults.length > 0) {
        // combine samples with lab results
        const samplePointCols = this.projectSamplesColDefs.slice(0, 3);
        this.projectLabResultsColDefs = [...samplePointCols, ...this.setAgGridColumnProps(labResults)];
        this.projectLabResultsRowData = this.mergeSamplesAndLabResults(labResults);
      }
      this.isLoadingData = false;
    } catch (err) {
      this.isLoadingData = false;
    }
  }

  async onTabChange(tabId) {
    this.isLoadingData = true;
    this.selectedTab = tabId;
    if (this.selectedProject && this.tabs[this.selectedTab] === 'Lab Analyte Results') {
      try {
        const labResults = await this.sadieProjectsService.getProjectLabResults(this.selectedProject);
        if (labResults.length > 0) {
          // this.projectLabResultsColDefs = this.setAgGridColumnProps(labResults);
          // this.projectLabResultsRowData = labResults;
          // combine samples with lab results
          const samplePointCols = this.projectSamplesColDefs.slice(0, 3);
          this.projectLabResultsColDefs = [...samplePointCols, ...this.setAgGridColumnProps(labResults)];
          this.projectLabResultsRowData = this.mergeSamplesAndLabResults(labResults);
        }
      } catch (err) {
        this.isLoadingData = false;
      }
    }
    if (this.selectedProject && this.tabs[this.selectedTab] === 'Sample Point Locations') {
      try {
        const results = await this.sadieProjectsService.getProjectSamples(this.selectedProject);
        this.projectSamplesColDefs = results.columnDefs;
        this.projectSamplesRowData = results.rowData;
      } catch (err) {
        this.isLoadingData = false;
      }
    }
    this.isLoadingData = false;
  }

  mergeSamplesAndLabResults(labResults) {
    const rowDataMerged = [];
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < this.projectSamplesRowData.length; i++) {
      rowDataMerged.push({...this.projectSamplesRowData[i], ...(labResults.find((itmInner) =>
         itmInner.Samp_No === this.projectSamplesRowData[i].Sample_Number))}
      );
    }
    return rowDataMerged;
  }

  setAgGridColumnProps(results) {
    const columnDefs = [];
    Object.keys(results[0]).forEach((key) => {
      columnDefs.push({headerName: key, field: key, sortable: true, filter: true});
    });
    return columnDefs;
  }

}
