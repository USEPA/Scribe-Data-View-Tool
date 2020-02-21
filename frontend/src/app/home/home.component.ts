import {Component, OnInit} from '@angular/core';
import {AppComponent} from '../app.component';
import {LoginService} from '../services/login.service';
import {
  Project,
  ProjectSample,
  ProjectLabResult,
  SadieProjectsService,
  ColumnsRows
} from '../services/sadie-projects.service';
import {MatDialog, MatSnackBar, MatChipInputEvent} from '@angular/material';
import {ActivatedRoute} from '@angular/router';
import {Subject, Subscription} from 'rxjs';
import {VisibleColumnsDialogComponent} from '../components/visible-columns-dialog/visible-columns-dialog.component';
import * as moment from 'moment';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Filters, ActiveFilter} from '../filters';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  userProjects: Project[];
  projectsLoaded: boolean;
  urlParamsSubscription: Subscription;
  selectedProject: string;
  selectedProjects: string[];
  queryFilterParams: any;
  tabs: any = {0: 'Lab Analyte Results', 1: 'Sample Point Locations'};
  selectedTab = 0;
  isLoadingData = false;
  // sample point props
  projectSamplesColDefs: any[] = [];
  projectSamplesRowData: ProjectSample[] = [];
  // lab results props
  projectLabResultsColDefs: any[] = [];
  projectLabResultsRowData: ProjectLabResult[] = [];
  // map / geo point props
  geoPointsArray = [];
  selectedGeoPoint: ProjectSample = null;
  // ag grid properties
  agGridRelationalOperators = {_lt: 'lessThan', _lte: 'lessThanOrEqual', _gt: 'greaterThan', _gte: 'greaterThanOrEqual'};
  agGridCustomFilters = null;
  updateColDefs: Subject<any> = new Subject<any>();
  presetFilters: Subject<any> = new Subject<any>();
  updateFilters: Subject<any> = new Subject<any>();
  exportLabResultsCSV: Subject<string> = new Subject<string>();
  exportSamplePointLocationCSV: Subject<string> = new Subject<string>();
  filterNavOpened = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  agGridActiveFilters: ActiveFilter[] = [];

  constructor(public app: AppComponent,
              public route: ActivatedRoute,
              public loginService: LoginService,
              public sadieProjectsService: SadieProjectsService,
              public dialog: MatDialog,
              public snackBar: MatSnackBar) {
    this.projectsLoaded = false;
  }

  async ngOnInit() {
    // Subscribing to query string parameters
    this.urlParamsSubscription = this.route.queryParams.subscribe(queryParams => {
      if (queryParams.projects) {
        this.queryFilterParams = queryParams;
        this.selectedProjects = this.queryFilterParams.projects.split(',').map(item => item.trim());
      }
    });
    if (this.loginService.access_token) {
      try {
        this.userProjects = await this.sadieProjectsService.getUserProjects();
        this.projectsLoaded = true;
        const projectIds = this.userProjects.map(p => p.projectid.toString());
        // If project IDs passed from query parameters exist, combine their results
        if (this.selectedProjects && this.selectedProjects.every((val) => projectIds.indexOf(val) >= 0)) {
          this.getCombinedProjectData(this.selectedProjects);
        }
      } catch (err) {
        return;
      }
    }
  }

  agGridFiltersChanged(filters: Filters) {
    // update the active filters
    this.agGridActiveFilters = filters.activeFilters;
    // update the filtered map points
    if (filters.filteredRowData && filters.filteredRowData.length > 0) {
      // IMPORTANT: pass in the sample point records that weren't filtered out to the map
      // TODO: Add a summary calculation of the lab results to pass in along with these sample point records in order to
      //  determine how the sample points need to be symbolized
      const filteredSamplePoints = [];
      this.projectSamplesRowData.forEach((samplePoint) => {
        filters.filteredRowData.forEach((result) => {
          if (result.Samp_No === samplePoint.Sample_Number && !filteredSamplePoints.includes(samplePoint)) {
            filteredSamplePoints.push(samplePoint);
          }
        });
      });
      this.geoPointsArray = this.getLatLongRecords(filteredSamplePoints);
    } else if (!filters.filteredRowData) {
      // if no filter applied, reset the map points
      this.geoPointsArray = this.getLatLongRecords(this.projectSamplesRowData);
    }
  }

  removeFilter(filter: ActiveFilter): void {
    const index = this.agGridActiveFilters.indexOf(filter);
    if (index >= 0) {
      this.agGridActiveFilters.splice(index, 1);
      if (this.agGridActiveFilters.length === 0 && this.filterNavOpened) {
        this.filterNavOpened = false;
      }
      // update filters in Ag Grid
      this.updateFilters.next(this.agGridActiveFilters);
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
      // remove current URL parameters
      window.history.replaceState({}, document.title, '/');
      // clear active filters
      this.agGridActiveFilters = [];
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
        this.projectLabResultsRowData = this.mergeSamplesAndLabResults(this.projectSamplesRowData, labResults);
      }
      // only pass in sample points for now
      this.geoPointsArray = this.getLatLongRecords(this.projectSamplesRowData);
      // set ag grid component custom filter properties
      this.setAgGridCustomFilters();
      this.isLoadingData = false;
    } catch (err) {
      this.isLoadingData = false;
    }
  }

  async getCombinedProjectData(projectIds) {
    // clear active filters
    this.agGridActiveFilters = [];
    let combinedSamplePointRowData = [];
    let combinedLabResultRowData = [];
    this.isLoadingData = true;
    // combine all project sample point and lab results data
    const projectsSamplePoints = await Promise.all(projectIds.map(async (projectId) => {
      const colsRows = await this.sadieProjectsService.getProjectSamples(projectId);
      return colsRows.rowData;
    }));
    // combine lab results
    const projectsLabResults = await Promise.all(projectIds.map(async (projectId) =>
      await this.sadieProjectsService.getProjectLabResults(projectId)
    ));
    combinedSamplePointRowData = [].concat(...projectsSamplePoints);
    combinedLabResultRowData = [].concat(...projectsLabResults);
    this.projectSamplesColDefs = this.setAgGridColumnProps(combinedSamplePointRowData);
    this.projectSamplesRowData = combinedSamplePointRowData;
    this.mergeSamplesAndLabResults(this.projectSamplesRowData, combinedLabResultRowData);
    if (combinedLabResultRowData.length > 0) {
      // combine samples with lab results
      const samplePointCols = this.projectSamplesColDefs.slice(0, 3);
      this.projectLabResultsColDefs = [...samplePointCols, ...this.setAgGridColumnProps(combinedLabResultRowData)];
      this.projectLabResultsRowData = this.mergeSamplesAndLabResults(this.projectSamplesRowData, combinedLabResultRowData);
    }
    // only pass in sample points for now
    this.geoPointsArray = this.getLatLongRecords(this.projectSamplesRowData);
    // set ag grid component custom filter properties
    this.setAgGridCustomFilters();
    this.isLoadingData = false;
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
          this.projectLabResultsRowData = this.mergeSamplesAndLabResults(this.projectSamplesRowData, labResults);
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

  mergeSamplesAndLabResults(samplePoints, labResults) {
    const rowDataMerged = [];
    labResults.forEach(result => {
      rowDataMerged.push({
          ...result, ...(samplePoints.find((point) =>
          point.Sample_Number === result.Samp_No))
        }
      );
    });
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
        columnDefs.push({
          colId: key,
          headerName: key, field: key, sortable: true,
          filter: 'agDateColumnFilter',
          filterParams: {
            comparator(filterLocalDateAtMidnight, cellValue) {
              const cellDateTime = new Date(cellValue);
              const cellDate = new Date(cellDateTime.getFullYear(), cellDateTime.getMonth(), cellDateTime.getDate());
              if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                return 0;
              }
              if (cellDate.getTime() < filterLocalDateAtMidnight.getTime()) {
                return -1;
              }
              if (cellDate.getTime() > filterLocalDateAtMidnight.getTime()) {
                return 1;
              }
            }
          },
          hide: false
        });
      } else if (!isNaN(results[0][key])) {
        columnDefs.push({colId: key, headerName: key, field: key, sortable: true, filter: 'agNumberColumnFilter', hide: false});
      } else {
        // defaults with default filter
        columnDefs.push({colId: key, headerName: key, field: key, sortable: true, filter: true, hide: false});
      }
    });
    return columnDefs;
  }

  setAgGridPresetFilters(columnDefs) {
    const hardcodedFilters = {};
    if (this.queryFilterParams) {
      const queryFilterDefinitions = this.definePresetAgGridFilterValues(this.queryFilterParams);
      for (const paramKey of Object.keys(queryFilterDefinitions)) {
        columnDefs.forEach((columnDef) => {
          if (columnDef.field.toLowerCase() === paramKey.toLowerCase()) {
            // determine the filter's field type
            if (columnDef.filter === 'agDateColumnFilter') {
              hardcodedFilters[columnDef.field] = {
                type: queryFilterDefinitions[paramKey].relationalOperator, dateFrom: queryFilterDefinitions[paramKey].value
              };
            } else if (columnDef.filter === 'agNumberColumnFilter') {
              hardcodedFilters[columnDef.field] = {
                type: queryFilterDefinitions[paramKey].relationalOperator, filter: queryFilterDefinitions[paramKey].value
              };
            } else {
              hardcodedFilters[columnDef.field] = {
                type: queryFilterDefinitions[paramKey].relationalOperator, value: queryFilterDefinitions[paramKey].value
              };
            }
          }
        });
      }
      this.presetFilters.next(hardcodedFilters);
      this.queryFilterParams = undefined;
    }
  }

  definePresetAgGridFilterValues(queryParams) {
    const queryFilterParams = {};
    const queryParamsClone = Object.assign({}, queryParams);
    delete queryParamsClone.projects;
    for (const paramKey of Object.keys(queryParamsClone)) {
      const operandMatch = Object.keys(this.agGridRelationalOperators).find((operandKey) => {
        if (paramKey.endsWith(operandKey)) {
          return this.agGridRelationalOperators[operandKey];
        }
      });
      if (operandMatch) {
        queryFilterParams[paramKey.replace(operandMatch, '').toLowerCase()] = {
          relationalOperator: this.agGridRelationalOperators[operandMatch],
          value: queryParamsClone[paramKey]
        };
      } else {
        queryFilterParams[paramKey.toLowerCase()] = {relationalOperator: 'equals', value: queryParamsClone[paramKey]};
      }
    }
    return queryFilterParams;
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
