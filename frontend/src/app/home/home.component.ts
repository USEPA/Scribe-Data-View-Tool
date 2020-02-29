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
import {ActivatedRoute, Router} from '@angular/router';
import {FormControl} from '@angular/forms';
import {Subject, Subscription, Observable} from 'rxjs';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {query} from '@angular/animations';
import * as moment from 'moment';
import {VisibleColumnsDialogComponent} from '../components/visible-columns-dialog/visible-columns-dialog.component';
import {Filters, ActiveFilter} from '../filters';
import {CONFIG_SETTINGS} from '../config_settings';


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
  selectedProjects: string[] = [];
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
  selectedPoint: ProjectSample = null;
  missingGeoPointsCount = 0;
  // ag grid properties
  agGridRelationalOperators = {
    _lt: 'lessThan',
    _lte: 'lessThanOrEqual',
    _gt: 'greaterThan',
    _gte: 'greaterThanOrEqual'
  };
  agGridCustomFilters = null;
  updateColDefs: Subject<any> = new Subject<any>();
  presetFilters: Subject<any> = new Subject<any>();
  updateFilters: Subject<any> = new Subject<any>();
  exportLabResultsCSV: Subject<string> = new Subject<string>();
  exportSamplePointLocationCSV: Subject<string> = new Subject<string>();
  filterNavOpened = false;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  agGridActiveFilters: ActiveFilter[] = [];
  projects = new FormControl();

  constructor(public app: AppComponent,
              public route: ActivatedRoute,
              public loginService: LoginService,
              public sadieProjectsService: SadieProjectsService,
              public dialog: MatDialog,
              public snackBar: MatSnackBar,
              public router: Router) {
    this.projectsLoaded = false;
  }

  async ngOnInit() {
    //
    this.userProjects = await this.sadieProjectsService.getUserProjects();

    // Subscribing to query string parameters
    this.urlParamsSubscription = this.route.queryParams.subscribe(queryParams => {
      if (queryParams.projects) {
        this.queryFilterParams = queryParams;
        const newSelectedProjects = this.queryFilterParams.projects.split(',').map(item => item.trim());
        const notLoadedProjects = newSelectedProjects.filter(projectId => !this.selectedProjects.includes(projectId));
        const removedProjects =  this.selectedProjects.filter(projectId => !newSelectedProjects.includes(projectId));
        if (notLoadedProjects.length > 0 || removedProjects.length > 0) {
          // clear active filters
          this.agGridActiveFilters = [];
          this.updateFilters.next([]);
          this.selectedProjects = newSelectedProjects; // todo: in the future only load projects that have not been loaded already
          this.getCombinedProjectData(this.selectedProjects);
          // tslint:disable-next-line:radix
          this.projects.setValue(this.selectedProjects.map(id => parseInt(id)));
        }
      }

      const filters = [];
      for (const key of Object.keys(queryParams).filter(k => k !== 'projects')) {
        filters.push({name: key, value: queryParams[key]});
      }
      this.applyFilter(filters);
    });
    // if (this.loginService.access_token) {
    // try {
    //   this.projectsLoaded = true;
    //   const projectIds = this.userProjects.map(p => p.projectid.toString());
    //   // If project IDs passed from query parameters exist, combine their results
    //   if (this.selectedProjects && this.selectedProjects.every((val) => projectIds.indexOf(val) >= 0)) {
    //
    //   }
    // } catch (err) {
    //   return;
    // }
    // }
  }

  agGridFiltersChanged(filters: Filters) {
    // update the active filters
    filters.activeFilters.forEach(filter => this.setQueryParam(filter.name, filter.value));
    // update the filtered map points
    if (filters.filteredRowData && filters.filteredRowData.length > 0) {
      // IMPORTANT: pass in the sample point records that weren't filtered out to the map
      // TODO: Add a summary calculation of the lab results to pass in along with these sample point records in order to
      //  determine how the sample points need to be symbolized
      const filteredSamplePoints = [];
      this.projectSamplesRowData.forEach((samplePoint) => {
        filters.filteredRowData.forEach((result) => {
          if (result.Samp_No === samplePoint.Samp_No && !filteredSamplePoints.includes(samplePoint)) {
            filteredSamplePoints.push(samplePoint);
          }
        });
      });
      this.geoPointsArray = this.getLatLongRecords(filteredSamplePoints);
      this.missingGeoPointsCount = this.projectSamplesRowData.length - this.geoPointsArray.length;
    } else if (filters.filteredRowData && filters.filteredRowData.length === 0) {
      // if 0 filtered results, clear map points
      this.geoPointsArray = [];
      this.missingGeoPointsCount = this.projectSamplesRowData.length;
    } else if (!filters.filteredRowData) {
      // if no filter applied, reset the map points
      this.geoPointsArray = this.getLatLongRecords(this.projectSamplesRowData);
      this.missingGeoPointsCount = this.projectSamplesRowData.length - this.geoPointsArray.length;
    }
  }

  applyFilter(activeFilters) {
    this.agGridActiveFilters = activeFilters;
  }

  removeFilter(filter: ActiveFilter): void {
    const index = this.agGridActiveFilters.indexOf(filter);
    if (index >= 0) {
      this.agGridActiveFilters.splice(index, 1);
      this.clearQueryParam(filter.name);
      // update filters in Ag Grid
      this.updateFilters.next(this.agGridActiveFilters);
    }
  }

  agGridRowSelected(val) {
    if (val.Latitude && val.Longitude) {
      this.selectedPoint = val;
    } else {
      this.snackBar.open('Selection has no geospatial point', null, {duration: 1000});
    }
  }

  mapGeoFeaturesLoaded(val) {
  }

  async getCombinedProjectData(projectIds) {
    let combinedSamplePointRowData = [];
    let combinedLabResultRowData = [];
    this.isLoadingData = true;
    // combine all project sample point and lab results data
    const projectsSamplePoints = await Promise.all(projectIds.map(async (projectId) => {
      const rows = await this.sadieProjectsService.getProjectSamples(projectId);
      return rows;
    }));
    // combine lab results
    const projectsLabResults = await Promise.all(projectIds.map(async (projectId) => {
      const rows = await this.sadieProjectsService.getProjectLabResults(projectId);
      return rows;
    }));
    combinedSamplePointRowData = [].concat(...projectsSamplePoints);
    combinedLabResultRowData = [].concat(...projectsLabResults);
    if (combinedSamplePointRowData.length > 0) {
      this.projectSamplesColDefs = this.setAgGridColumnProps(combinedSamplePointRowData);
      this.projectSamplesRowData = combinedSamplePointRowData;
      // combine samples with lab results
      const samplePointCols = this.projectSamplesColDefs.filter( (value, index, array) => {
        if (['Sample Number', 'Sample Date', 'Sample Type', 'Latitude', 'Longitude'].includes(array[index].headerName)) {
          return array[index].headerName;
        }
      });
      // const samplePointCols = this.projectSamplesColDefs.slice(0, 3);
      this.projectLabResultsColDefs = [...samplePointCols, ...this.setAgGridColumnProps(combinedLabResultRowData)];
      this.projectLabResultsRowData = this.mergeSamplesAndLabResults(this.projectSamplesRowData, combinedLabResultRowData);
      // set ag grid component custom filter properties
      this.setAgGridCustomFilters();
      if (this.projectLabResultsRowData.length > 0) {
        // only pass in sample points for now
        this.geoPointsArray = this.getLatLongRecords(this.projectSamplesRowData);
        this.missingGeoPointsCount = this.projectSamplesRowData.length - this.geoPointsArray.length;
      }
    }
    this.isLoadingData = false;
  }

  async onTabChange(tabId) {
    this.selectedTab = tabId;
    if (this.selectedProjects) {
      try {
        this.getCombinedProjectData(this.selectedProjects);
      } catch (err) {
        this.isLoadingData = false;
      }
    }
  }

  getLatLongRecords(records: any) {
    const latLongRecords = [];
    records.forEach((record: ProjectSample) => {
      const sampleRecord = record;
      if (sampleRecord.Latitude && sampleRecord.Longitude) {
        latLongRecords.push(sampleRecord);
      }
    });
    return latLongRecords;
  }

  mergeSamplesAndLabResults(samplePoints, labResults) {
    const rowDataMerged = [];
    labResults.forEach(result => {
      rowDataMerged.push({
          ...result, ...(samplePoints.find((point) =>
          point.Samp_No === result.Samp_No))
        }
      );
    });
    return rowDataMerged;
  }

  setAgGridCustomFilters() {
    this.agGridCustomFilters = {
      // Sample Type is Matrix alias
      Matrix: {
        filterName: 'selectFilter',
        filterValues: this.getDistinctValuesByKey(this.projectSamplesRowData, 'Matrix')
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
    try {
      Object.keys(results[0]).forEach((key) => {
        const headerName = CONFIG_SETTINGS.defaultColumnSettings.hasOwnProperty(key)
          ? CONFIG_SETTINGS.defaultColumnSettings[key].alias : key;
        const hide = CONFIG_SETTINGS.defaultColumnSettings.hasOwnProperty(key)
          ? CONFIG_SETTINGS.defaultColumnSettings[key].hide : false;
        if (key.includes('Date') || key.includes('Date_') || key.includes('_Date')) {
          columnDefs.push({
            colId: key,
            headerName,
            field: key,
            sortable: true,
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
            hide
          });
        } else if (!isNaN(results[0][key])) {
          columnDefs.push({
            colId: key,
            headerName,
            field: key,
            sortable: true,
            filter: 'agNumberColumnFilter',
            hide
          });
        } else {
          // defaults with default filter
          columnDefs.push({colId: key, headerName, field: key, sortable: true, filter: true, hide});
        }
      });
      return columnDefs;
    } catch (err) {
      return columnDefs;
    }
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
                type: queryFilterDefinitions[paramKey].relationalOperator,
                dateFrom: queryFilterDefinitions[paramKey].value
              };
            } else if (columnDef.filter === 'agNumberColumnFilter') {
              hardcodedFilters[columnDef.field] = {
                type: queryFilterDefinitions[paramKey].relationalOperator,
                filter: queryFilterDefinitions[paramKey].value
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

  setQueryParam(field: string, value: any) {
    const queryParams = {};
    queryParams[field] = value;
    this.router.navigate([], {queryParams, queryParamsHandling: 'merge'});
  }

  clearQueryParam(field) {
    const queryParams = {};
    Object.keys(this.route.snapshot.queryParams).filter(k => k !== field).forEach(key => {
      queryParams[key] = this.route.snapshot.queryParams[key];
    });
    this.router.navigate([], {queryParams});
  }
}
