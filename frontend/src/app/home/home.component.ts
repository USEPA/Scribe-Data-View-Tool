import {Component, OnInit} from '@angular/core';
import {AppComponent} from '../app.component';
import {LoginService} from '../services/login.service';
import {SadieProjectsService} from '@services/sadie-projects.service';
import {Project, ProjectSample, ProjectLabResult, ColumnDefs} from '../projectDataTypes';
import {MatDialog, MatSnackBar, MatChipInputEvent} from '@angular/material';
import {ActivatedRoute, Params, Router} from '@angular/router';
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
  projectSamplesColDefs: ColumnDefs[] = [];
  projectSamplesRowData: ProjectSample[] = [];
  // lab results props
  projectLabResultsColDefs: ColumnDefs[] = [];
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
  displayFilterOperators = {
    equals: '=',
    lessThan: '<',
    lessThanOrEqual: '<=',
    greaterThan: '>',
    greaterThanOrEqual: '>='
  };
  queryParamOperators = {
    equals: '',
    lessThan: '_lt',
    lessThanOrEqual: '_lte',
    greaterThan: '_gt',
    greaterThanOrEqual: '_gte',
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
        const removedProjects = this.selectedProjects.filter(projectId => !newSelectedProjects.includes(projectId));
        if (notLoadedProjects.length > 0 || removedProjects.length > 0) {
          // clear active filters
          this.agGridActiveFilters = [];
          this.selectedProjects = newSelectedProjects; // todo: in the future only load projects that have not been loaded already
          this.getCombinedProjectData(this.selectedProjects);
          // tslint:disable-next-line:radix
          this.projects.setValue(this.selectedProjects.map(id => parseInt(id)));
        }
      }

      /*const filters = [];
      for (const key of Object.keys(queryParams).filter(k => k !== 'projects')) {
        filters.push({name: key, value: queryParams[key]});
      }*/

    });
  }

  agGridFiltersChanged(filters: Filters) {
    // 1) Update the query params / active filters
    if (filters.activeFilters.length === 0) {
      // if no filters applied, clear query params / active filters
      this.clearQueryParams();
      this.agGridActiveFilters = [];
    } else {
      const newAgGridFilters = [...filters.activeFilters.map(item => item.field)];
      const currentAgGridFilters = [...this.agGridActiveFilters.map(item => item.field)];
      const removedAgGridFilters = currentAgGridFilters.filter(x => !newAgGridFilters.includes(x));
      if (removedAgGridFilters.length > 0) {
        this.agGridActiveFilters.forEach((activeFilter, index) => {
          if (removedAgGridFilters.includes(activeFilter.field)) {
            this.agGridActiveFilters.splice(index, 1);
            this.clearQueryParam(activeFilter);
          }
        });
      } else { // loop through new Ag Grid filters to check for added or updated filters
        filters.activeFilters.forEach((agGridFilter) => {
          // check for added filter
          if (currentAgGridFilters.indexOf(agGridFilter.field) === -1) {
            const queryParamAlias = CONFIG_SETTINGS.defaultColumnSettings.hasOwnProperty(agGridFilter.field)
                ? CONFIG_SETTINGS.defaultColumnSettings[agGridFilter.field].alias : agGridFilter.field;
            const queryParamOperator = this.queryParamOperators[agGridFilter.operand];
            this.agGridActiveFilters.push({
              field: agGridFilter.field,
              queryParam: `${queryParamAlias}${queryParamOperator}`,
              alias: queryParamAlias,
              operand: this.displayFilterOperators[agGridFilter.operand],
              value: agGridFilter.value,
            });
            this.addQueryParam(this.agGridActiveFilters[this.agGridActiveFilters.length - 1]);
          } else {
            // check for updated filter value and/or operand
            this.agGridActiveFilters.forEach((activeFilter) => {
              if (activeFilter.field === agGridFilter.field) {
                if ((activeFilter.value.toString() !== agGridFilter.value.toString())) {
                  activeFilter.value = agGridFilter.value;
                  this.updateQueryParam(activeFilter);
                }
                const activeOperand = activeFilter.operand;
                const newOperand = agGridFilter.operand;
                if (activeOperand && newOperand && (this.displayFilterOperators[newOperand] !== activeOperand)) {
                  this.clearQueryParam(activeFilter);
                  activeFilter.operand = this.displayFilterOperators[agGridFilter.operand];
                  activeFilter.queryParam = activeFilter.alias + this.queryParamOperators[newOperand];
                  this.updateQueryParam(activeFilter);
                }
              }
            });
          }
        });
      }
    }
    // 2) Update the filtered map points
    if (filters.filteredRowData.length > 0) {
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

      // refresh missing map points number
      const totalMapPoints = this.getLatLongRecords(filters.filteredRowData);
      this.missingGeoPointsCount = filters.filteredRowData.length - totalMapPoints.length;
      // this.missingGeoPointsCount = this.geoPointsArray.length === 0 ? 0 : filteredSamplePoints.length - this.geoPointsArray.length;
    } else if (filters.filteredRowData.length === 0) {
      // if 0 filtered results, clear map points
      this.geoPointsArray = [];
      this.missingGeoPointsCount = this.projectSamplesRowData.length;
    } else {
      // refresh data
      this.getCombinedProjectData(this.selectedProjects);
    }
  }

  removeActiveFilter(filter: ActiveFilter): void {
    const index = this.agGridActiveFilters.indexOf(filter);
    if (index >= 0) {
      this.agGridActiveFilters.splice(index, 1);
      this.clearQueryParam(filter);
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
      // only pass in sample points for now
      this.geoPointsArray = this.getLatLongRecords(this.projectSamplesRowData);
      this.missingGeoPointsCount = this.projectSamplesRowData.length - this.geoPointsArray.length;
      if (this.selectedTab === 0) {
        const addedSamplePointColIDs = ['Samp_No', 'SampleDate', 'Matrix', 'Latitude', 'Longitude'];
        // combine samples with lab results
        const samplePointCols = this.projectSamplesColDefs.filter((value, index, array) => {
          if (addedSamplePointColIDs.includes(array[index].colId)) {
            return array[index].colId;
          }
        });
        this.projectLabResultsColDefs = [...samplePointCols, ...this.setAgGridColumnProps(combinedLabResultRowData, addedSamplePointColIDs)];
        this.projectLabResultsRowData = this.mergeSamplesAndLabResults(this.projectSamplesRowData, combinedLabResultRowData);
        this.missingGeoPointsCount = this.getMissingGeoPoints(this.projectSamplesRowData, combinedLabResultRowData);
      }
      // set ag grid component custom filter properties
      this.setAgGridCustomFilters();
    }
    this.isLoadingData = false;
  }

  async onTabChange(tabId) {
    this.selectedTab = tabId;
    if (this.selectedProjects) {
      try {
        // clear filters and get tab data
        this.clearQueryParams();
        this.agGridActiveFilters = [];
        this.updateFilters.next([]);
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
      });
    });
    return rowDataMerged;
  }

  getMissingGeoPoints(samplePoints, labResults) {
    let missingGeoPointsCount = 0;
    labResults.forEach(result => {
      const found = samplePoints.find((point) => {
        if (point.Samp_No === result.Samp_No) {
          return point;
        }
      });
      if (found) {
        if (!found.Latitude || !found.Longitude) {
          missingGeoPointsCount = missingGeoPointsCount + 1;
        }
      }
    });
    return missingGeoPointsCount;
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

  setAgGridColumnProps(results, addedColIDs = []) {
    const columnDefs = [];
    try {
      Object.keys(results[0]).forEach((key) => {
        if (!addedColIDs.includes(key)) {
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
        }
      });
      return columnDefs;
    } catch (err) {
      return columnDefs;
    }
  }

  setAgGridPresetFilters(columnDefs) {
    const agGridPresetFilters = {};
    if (this.queryFilterParams) {
      const agGridFilterDefinitions = this.definePresetAgGridFilterValues(this.queryFilterParams);
      for (const paramKey of Object.keys(agGridFilterDefinitions)) {
        // add active filter for chips
        this.agGridActiveFilters.push({
          field: paramKey,
          queryParam: agGridFilterDefinitions[paramKey].queryParam,
          alias: CONFIG_SETTINGS.defaultColumnSettings[paramKey].alias,
          operand: this.displayFilterOperators[agGridFilterDefinitions[paramKey].relationalOperator],
          value: agGridFilterDefinitions[paramKey].value,
        });
        columnDefs.forEach((columnDef) => {
          if (columnDef.field === paramKey) {
            // determine the Ag Grid field's filter type
            if (columnDef.filter === 'agDateColumnFilter') {
              agGridPresetFilters[columnDef.field] = {
                type: agGridFilterDefinitions[paramKey].relationalOperator,
                dateFrom: agGridFilterDefinitions[paramKey].value
              };
            } else if (columnDef.filter === 'agNumberColumnFilter') {
              agGridPresetFilters[columnDef.field] = {
                type: agGridFilterDefinitions[paramKey].relationalOperator,
                filter: agGridFilterDefinitions[paramKey].value
              };
            } else {
              agGridPresetFilters[columnDef.field] = {
                type: agGridFilterDefinitions[paramKey].relationalOperator,
                value: agGridFilterDefinitions[paramKey].value
              };
            }
          }
        });
      }
      this.presetFilters.next(agGridPresetFilters);
      this.queryFilterParams = undefined;
    }
  }

  definePresetAgGridFilterValues(queryParams) {
    const queryFilterParams = {};
    const queryParamsClone = Object.assign({}, queryParams);
    delete queryParamsClone.projects;
    for (const paramKey of Object.keys(queryParamsClone)) {
      // lookup corresponding Ag Grid filter operand
      const operandMatch = Object.keys(this.agGridRelationalOperators).find((operandKey) => {
        if (paramKey.endsWith(operandKey)) {
          return this.agGridRelationalOperators[operandKey];
        }
      });
      // lookup column definition's field name from the query parameter's alias name
      const paramFieldName = paramKey.replace(operandMatch, '').trim().toLowerCase();
      const columnField = Object.keys(CONFIG_SETTINGS.defaultColumnSettings).find((key) => {
        // handle case sensitivity here
        if (CONFIG_SETTINGS.defaultColumnSettings[key].alias.trim().toLowerCase() === paramFieldName) {
          return key;
        }
      });
      if (columnField) {
        if (operandMatch) {
          queryFilterParams[columnField] = {
            queryParam: paramKey.trim(),
            relationalOperator: this.agGridRelationalOperators[operandMatch],
            value: queryParamsClone[paramKey]
          };
        } else {
          // default to equals operand
          queryFilterParams[columnField] = {queryParam: paramKey.trim(), relationalOperator: 'equals', value: queryParamsClone[paramKey]};
        }
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

  /*
  * Route Query Parameter methods
  */
  setQueryParam(field: string, value: any) {
    const queryParams = {};
    queryParams[field] = value;
    this.router.navigate([], {queryParams, queryParamsHandling: 'merge'});
  }

  addQueryParam(addedFilter: ActiveFilter) {
    const queryParams = {};
    queryParams[addedFilter.queryParam] = addedFilter.value;
    this.router.navigate([], {queryParams, queryParamsHandling: 'merge'});
  }

  updateQueryParam(updatedFilter: ActiveFilter) {
    const queryParams: Params = {};
    queryParams[updatedFilter.queryParam] = updatedFilter.value;
    this.router.navigate([], {queryParams, queryParamsHandling: 'merge'});
  }

  clearQueryParam(removedFilter: ActiveFilter) {
    const clearedQueryParams = {};
    Object.keys(this.route.snapshot.queryParams).filter(k => k !== removedFilter.queryParam).forEach((key) => {
      clearedQueryParams[key] = this.route.snapshot.queryParams[key];
    });
    this.router.navigate([], {queryParams: clearedQueryParams});
  }

  clearQueryParams() {
    const queryParams = {};
    Object.keys(this.route.snapshot.queryParams).filter(k => k === 'projects').forEach(key => {
      queryParams[key] = this.route.snapshot.queryParams[key];
    });
    this.router.navigate([], {queryParams});
  }
}
