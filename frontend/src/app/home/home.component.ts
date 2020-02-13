import {Component, OnInit} from '@angular/core';
import {AppComponent} from '../app.component';
import {LoginService} from '../services/login.service';
import {Project, ProjectSample, ProjectLabResult, SadieProjectsService} from '../services/sadie-projects.service';
import {MatDialog, MatSnackBar} from '@angular/material';
import {Subject} from 'rxjs';
import {VisibleColumnsDialogComponent} from '../components/visible-columns-dialog/visible-columns-dialog.component';
import * as moment from 'moment';

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
  projectSamplesColDefs: any[] = [];
  projectSamplesRowData: ProjectSample[] = [];
  // lab result props
  projectLabResultsColDefs: any[] = [];
  projectLabResultsRowData: ProjectLabResult[] = [];
  // map / geo point props
  geoPointsArray = [];
  selectedGeoPoint: ProjectSample = null;
  // ag grid properties
  agGridCustomFilters = null;
  updateColDefs: Subject<any> = new Subject<any>();
  exportLabResultsCSV: Subject<string> = new Subject<string>();
  exportSamplePointLocationCSV: Subject<string> = new Subject<string>();

  constructor(public app: AppComponent,
              public loginService: LoginService,
              public sadieProjectsService: SadieProjectsService,
              public dialog: MatDialog,
              public snackBar: MatSnackBar) {
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

  agGridRowSelected(val) {
    if (val.Lat && val.Long) {
      this.selectedGeoPoint = val;
    } else {
      this.snackBar.open('Selection has no geospatial point', null, {duration: 1000});
    }
  }

  mapGeoFeaturesLoaded(val) {
  }

  async getProjectData(selectedProjectId) {
    try {
      this.isLoadingData = true;
      // get project sample data
      const sampleResults = await this.sadieProjectsService.getProjectSamples(selectedProjectId);
      this.projectSamplesColDefs = this.setAgGridColumnProps(sampleResults.rowData);
      this.projectSamplesRowData = sampleResults.rowData;
      // get project lab data
      const labResults = await this.sadieProjectsService.getProjectLabResults(selectedProjectId);
      if (labResults.length > 0) {
        // combine samples with lab results
        const samplePointCols = this.projectSamplesColDefs.slice(0, 3);
        this.projectLabResultsColDefs = [...samplePointCols, ...this.setAgGridColumnProps(labResults)];
        this.projectLabResultsRowData = this.mergeSamplesAndLabResults(labResults);
      }
      // set map component's geo points array and popup template object
      // if (this.selectedProject && this.tabs[this.selectedTab] === 'Lab Analyte Results') {
      //   this.geoPointsArray = this.getLatLongRecords(this.projectLabResultsRowData);
      // } else {
      //   this.geoPointsArray = this.getLatLongRecords(this.projectSamplesRowData);
      // }
      // only pass in points for now
      this.geoPointsArray = this.getLatLongRecords(this.projectSamplesRowData);
      // set ag grid component custom filter properties
      this.setAgGridCustomFilters();
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
          // combine samples with lab results
          const samplePointCols = this.projectSamplesColDefs.slice(0, 3);
          this.projectLabResultsColDefs = [...samplePointCols, ...this.setAgGridColumnProps(labResults)];
          this.projectLabResultsRowData = this.mergeSamplesAndLabResults(labResults);
          // set map component's geo points array and popup template object
          this.geoPointsArray = this.getLatLongRecords(this.projectSamplesRowData);
        }
      } catch (err) {
        this.isLoadingData = false;
      }
    }
    if (this.selectedProject && this.tabs[this.selectedTab] === 'Sample Point Locations') {
      try {
        const results = await this.sadieProjectsService.getProjectSamples(this.selectedProject);
        this.projectSamplesColDefs = this.setAgGridColumnProps(results.rowData);
        this.projectSamplesRowData = results.rowData;
        // set map component's geo points array and popup template object
        this.geoPointsArray = this.getLatLongRecords(this.projectSamplesRowData);
      } catch (err) {
        this.isLoadingData = false;
      }
    }
    this.isLoadingData = false;
  }

  getLatLongRecords(records: any) {
    const latLongRecords = [];
    records.forEach((record: ProjectSample) => {
      if (record.Lat && record.Long) {
        latLongRecords.push(record);
      }
    });
    return latLongRecords;
  }

  mergeSamplesAndLabResults(labResults) {
    const rowDataMerged = [];
    labResults.forEach(result => {
      rowDataMerged.push({...result, ...(this.projectSamplesRowData.find((point) =>
         point.Sample_Number === result.Samp_No))}
      );
    });
    // tslint:disable-next-line:prefer-for-of
    // for (let i = 0; i < this.projectSamplesRowData.length; i++) {
    //   rowDataMerged.push({
    //       ...this.projectSamplesRowData[i], ...(labResults.find((itmInner) =>
    //       itmInner.Samp_No === this.projectSamplesRowData[i].Sample_Number))
    //     }
    //   );
    // }
    return rowDataMerged;
  }

  setAgGridCustomFilters() {
    this.agGridCustomFilters = {
      Sample_Type: {
        filterName: 'selectFilter',
        filterValues: this.getDistinctValuesByKey(this.projectSamplesRowData, 'Sample_Type')
      },
      Analyte: {
        filterName: 'selectFilter',
        filterValues: this.getDistinctValuesByKey(this.projectLabResultsRowData, 'Analyte')
      }
    };
  }

  getDistinctValuesByKey(arr: any[], key: string) {
    const result = [];
    for (const item of arr) {
      if (item[key] && !result.includes(item[key])) {
        result.push(item[key]);
      }
    }
    return result;
  }

  setAgGridColumnProps(results) {
    const columnDefs = [];
    Object.keys(results[0]).forEach((key) => {
      if (key.includes('Date_') || key.includes('_Date')) {
        columnDefs.push({headerName: key, field: key, sortable: true,
          filter: 'agDateColumnFilter',
          filterParams: {
            comparator(filterLocalDateAtMidnight, cellValue) {
              const cellDate = new Date(cellValue);
              if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                return 0;
              }
              if (cellDate < filterLocalDateAtMidnight) {
                return -1;
              }
              if (cellDate > filterLocalDateAtMidnight) {
                return 1;
              }
            }
          },
          hide: false
        });
      } else if (!isNaN(results[0][key])) {
        columnDefs.push({headerName: key, field: key, sortable: true, filter: 'agNumberColumnFilter', hide: false});
      } else {
        // defaults with default filter
        columnDefs.push({headerName: key, field: key, sortable: true, filter: true, hide: false});
      }
    });
    return columnDefs;
  }

  openVisibleColumnsDialog() {
    let currentColumns = [];
    if (this.tabs[this.selectedTab] === 'Lab Analyte Results') {
      currentColumns = this.projectLabResultsColDefs;
    }
    if (this.tabs[this.selectedTab] === 'Sample Point Locations') {
      currentColumns = this.projectSamplesColDefs;
    }
    const dialogRef = this.dialog.open(VisibleColumnsDialogComponent, {
      width: '400px',
      data: {
        columns: currentColumns
      }
    });
    dialogRef.afterClosed().subscribe(results => {
      if (results && results.done) {
        this.updateColDefs.next(results.columns);
      }
    });
  }

  onExportCSVBtnClick() {
    // set ag grid title
    const title = 'PID_' + this.selectedProject + '_' + this.tabs[this.selectedTab];
    if (this.selectedTab === 0) {
      this.exportLabResultsCSV.next(title);
    }
    if (this.selectedTab === 1) {
      this.exportSamplePointLocationCSV.next(title);
    }
  }
}
