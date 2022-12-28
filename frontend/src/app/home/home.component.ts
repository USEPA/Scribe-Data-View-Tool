import {AfterViewInit, Component, OnInit, ElementRef, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {FormControl, Validators} from '@angular/forms';
import {Subject, Subscription, Observable, BehaviorSubject} from 'rxjs';
import {COMMA, ENTER, SPACE} from '@angular/cdk/keycodes';

import {MatAutocomplete, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatChipInputEvent} from '@angular/material/chips';


import {query} from '@angular/animations';
import * as moment from 'moment';

import {AppComponent} from '../app.component';
import {
  Project,
  ProjectSample,
  ProjectLabResult,
  ColumnDefs,
  MapSymbolizationProps,
  MapSymbol,
  ProjectCentroid, ColumnsRows, AGOLService, ProjectExplorer
} from '../projectInterfaceTypes';
import {LoginService} from '../auth/login.service';
import {ScribeDataExplorerService} from '@services/scribe-data-explorer.service';
import {VisibleColumnsDialogComponent} from '@components/visible-columns-dialog/visible-columns-dialog.component';
import {ProjectsMapDialogComponent} from '@components/projects-map-dialog/projects-map-dialog.component';
import {FiltersInterfaceTypes, ActiveFilter} from '../filtersInterfaceTypes';
import {CONFIG_SETTINGS} from '../config_settings';
import {MatSnackBar} from '@angular/material/snack-bar';
import {count, map, startWith} from 'rxjs/operators';

import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';


@Component({
  selector: 'app-home',
  // templateUrl: './home.component.html',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit, AfterViewInit {
  tabs: any = {0: 'Lab Analyte Results', 1: 'Sample Point Locations'};
  selectedTab = 0;
  isLoadingData = false;
  // project props
  projects = new FormControl();
  userProjects: Project[] | any;
  userExploredProjects: ProjectExplorer[] | any;
  projectsLoaded: boolean;
  selectedProjectIDs: string[] = [];
  isMapPointsSelected = false;
  // sample point props
  projectSamplesColDefs: ColumnDefs[] = [];
  projectSamplesRowData: ProjectSample[] = [];
  // lab results props
  combinedLabResultRowData = [];
  projectLabResultsColDefs: ColumnDefs[] = [];
  projectLabResultsRowData: ProjectLabResult[] = [];
  // map / geo point props
  geoPointsArray = [];
  selectedPoints: string[];
  missingGeoPointsCount = 0;
  // Map MDL symbolization props
  isReadyToSymbolizeMapPoints = false;
  mapSymbolFields = [];
  mapPointSymbolBreaks: number = CONFIG_SETTINGS.mapPointSymbolBreaks;
  mapSymbolDefinitions: MapSymbol[] = [];
  mdlThreshold = new FormControl();
  mdlMin = null;
  mdlMax = null;
  colsSpan = 1;
  // url query param filtering props
  queryFilterParams: any;
  // urlParamsSubscription: Subscription;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  // AgGrid filter and events props
  agGridCustomFilters = null;
  private _agGridActiveFilters: ActiveFilter[] = [];
  agGridActiveFiltersSubject: Subject<ActiveFilter[]> = new Subject<ActiveFilter[]>();
  agGridActiveFiltersEvt: Observable<ActiveFilter[]> = this.agGridActiveFiltersSubject.asObservable();
  updateColDefs: Subject<any> = new Subject<any>();
  presetFilters: Subject<any> = new Subject<any>();
  updateFilters: Subject<any> = new Subject<any>();
  publishLabResultsToAGOL = new BehaviorSubject<{ title: string, description: string }>(null);
  publishSamplePointLocationsToAGOL = new BehaviorSubject<{ title: string, description: string }>(null);
  exportLabResultsCSV: Subject<string> = new BehaviorSubject<string>(null);
  exportSamplePointLocationCSV: Subject<string> = new BehaviorSubject<string>(null);
  showTable = false;
  public selectedAnalyte: Observable<string>;

  get agGridActiveFilters() {
    return this._agGridActiveFilters;
  }

  set agGridActiveFilters(value: ActiveFilter[]) {
    this._agGridActiveFilters = value;
    this.agGridActiveFiltersSubject.next(value);
  }

  visible = true;
  selectable = true;
  removable = true;
  projectCtrl = new FormControl('');
  filteredProjects: Observable<ProjectExplorer[]>;
  projectsList: Project[] = [];
  projectIdsList: number[] = [];

  @ViewChild('projectInput') projectInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  constructor(public app: AppComponent,
              public route: ActivatedRoute,
              public loginService: LoginService,
              public scribeDataExplorerService: ScribeDataExplorerService,
              public dialog: MatDialog,
              public snackBar: MatSnackBar,
              public router: Router) {
    this.projectsLoaded = false;
  }

  async ngOnInit() {
    this.userProjects = await this.scribeDataExplorerService.getUserProjects();
    // this.userExploredProjects = await this.scribeDataExplorerService.getUserExploredProjects();
    this.setFilter();
    await this.scribeDataExplorerService.getPublishedAGOLServices().then((items: AGOLService[]) => {
        this.scribeDataExplorerService.userAGOLServices.next(items);
     });

    // // Subscribing to query string parameters
    // const queryParams = this.route.snapshot.queryParams;
    // if (queryParams.projects) {
    //   this.queryFilterParams = queryParams;
    //   const newselectedProjectIDs = this.queryFilterParams.projects.split(',').map(item => item.trim());
    //   // const notLoadedProjects = newselectedProjectIDs.filter(projectId => !this.selectedProjectIDs.includes(projectId));
    //   // const removedProjects = this.selectedProjectIDs.filter(projectId => !newselectedProjectIDs.includes(projectId));
    //   // clear active filters
    //   this.agGridActiveFilters = [];
    //   this.selectedProjectIDs = newselectedProjectIDs; // todo: in the future only load projects that have not been loaded already
    //   await this.getCombinedProjectData(this.selectedProjectIDs);
    //   // tslint:disable-next-line:radix
    //   // this.projects.setValue(this.selectedProjectIDs.map(id => parseInt(id)));
    // }
    // /*const filters = [];
    // for (const key of Object.keys(queryParams).filter(k => k !== 'projects')) {
    //   filters.push({name: key, value: queryParams[key]});
    // }*/

    this.agGridActiveFilters = [];
    this.colsSpan = (window.innerWidth > 1050) ? 1 : 2;
    this.selectedAnalyte = this.route.queryParams.pipe(map(params => params.Analyte));
  }

  ngAfterViewInit() {
    // subscribe to changes to active Ag Grid filter
    this.agGridActiveFiltersEvt.subscribe((agGridActiveFilters) => {
      this.checkReadyToSymbolizeMapPoints();
    });
    // subscribe to MDL value entered event
    this.scribeDataExplorerService.mapPointsSymbolizationChangedEvent.subscribe((symbologyDefinitions) => {
      if (symbologyDefinitions && this.mapSymbolDefinitions !== symbologyDefinitions) {
        this.mapSymbolDefinitions = symbologyDefinitions;
      }
    });

    // subscribe to selected map points events, and filter table rows to the subset of selected sample points
    this.scribeDataExplorerService.mapPointsSelectedChangedEvent.subscribe((selectedSamplePointsRowData) => {
      if (selectedSamplePointsRowData) {
        this.projectLabResultsRowData = this.mergeSelectedSamplesAndLabResults(selectedSamplePointsRowData, this.combinedLabResultRowData);
        this.isMapPointsSelected = true;
      } else {
        this.projectLabResultsRowData = this.mergeAllSamplesAndLabResults(this.projectSamplesRowData, this.combinedLabResultRowData);
        this.isMapPointsSelected = false;
      }
    });
    this.scribeDataExplorerService.mapPointSelectedChangedEvent.subscribe((pointAttributes) => {
      if (pointAttributes) {
        this.isMapPointsSelected = true;
      } else {
        this.isMapPointsSelected = false;
      }
    });
  }

  openProjectsMapDialog() {
    // this.initProps();
    const dialogRef = this.dialog.open(ProjectsMapDialogComponent, {
      width: '800px',
      data: {}
    });
    dialogRef.afterClosed().subscribe(results => {
      if (results && results.done) {
        const projectCentroids: ProjectCentroid[] = results.data;
        const newSelectedProjectIDs = projectCentroids.map((projectCentroid) => {
          return projectCentroid.PROJECTID;
        });
        const currentselectedProjectIDs = this.projectIdsList;
        if (!currentselectedProjectIDs || (currentselectedProjectIDs.sort().join(',') !== newSelectedProjectIDs.sort().join(','))) {
          this.clearProjects();
          this.setQueryParam('projects', newSelectedProjectIDs.join(','));
        }
      }
    });
  }

  agGridFiltersChanged(filters: FiltersInterfaceTypes) {
    // 1) Update the query params / active filters
    // if (filters.activeFilters.length === 0) {
    //   // if no filters applied, clear query params / active filters / map properties
    //   this.initProps();
    // } else {
    const newAgGridFilters = [...filters.activeFilters.map(item => item.field)];
    const currentAgGridFilters = [...this.agGridActiveFilters.map(item => item.field)];
    const removedAgGridFilters = currentAgGridFilters.filter(x => !newAgGridFilters.includes(x));
    if (removedAgGridFilters.length > 0) {
      this.agGridActiveFilters.forEach((activeFilter, index) => {
        if (removedAgGridFilters.includes(activeFilter.field)) {
          this.agGridActiveFilters.splice(index, 1);
          this.agGridActiveFilters = this.agGridActiveFilters.slice();
          this.clearQueryParam(activeFilter);
        }
      });
    } else {
      // loop through new Ag Grid filters to check for added or updated filters
      this.mapSymbolFields = [];
      filters.activeFilters.forEach((agGridFilter) => {
        // check for added filter
        if (currentAgGridFilters.indexOf(agGridFilter.field) === -1) {
          const queryParamAlias = CONFIG_SETTINGS.defaultColumnSettings.hasOwnProperty(agGridFilter.field)
            ? CONFIG_SETTINGS.defaultColumnSettings[agGridFilter.field].alias : agGridFilter.field;
          const queryParamOperator = CONFIG_SETTINGS.queryParamOperators[agGridFilter.operand];
          const newActiveFilter = {
            field: agGridFilter.field,
            queryParam: `${queryParamAlias}${queryParamOperator}`,
            alias: queryParamAlias,
            operand: CONFIG_SETTINGS.displayFilterOperators[agGridFilter.operand],
            value: agGridFilter.value,
          };
          this.agGridActiveFilters = [...this.agGridActiveFilters, newActiveFilter];
          this.addQueryParam(this.agGridActiveFilters[this.agGridActiveFilters.length - 1]);
        } else { // check for updated filter value and/or operand
          this.agGridActiveFilters.forEach((activeFilter) => {
            if (activeFilter.field === agGridFilter.field) {
              if ((activeFilter.value.toString() !== agGridFilter.value.toString())) {
                activeFilter.value = agGridFilter.value;
                this.updateQueryParam(activeFilter);
              }
              const activeOperand = activeFilter.operand;
              const newOperand = agGridFilter.operand;
              if (activeOperand && newOperand && (CONFIG_SETTINGS.displayFilterOperators[newOperand] !== activeOperand)) {
                this.clearQueryParam(activeFilter);
                activeFilter.operand = CONFIG_SETTINGS.displayFilterOperators[agGridFilter.operand];
                activeFilter.queryParam = activeFilter.alias + CONFIG_SETTINGS.queryParamOperators[newOperand];
                this.updateQueryParam(activeFilter);
              }
            }
          });
        }
        // check for any map symbology selections
        if (this.scribeDataExplorerService.mapSymbolFieldAliases.includes(agGridFilter.field)) {
          this.mapSymbolFields.push(agGridFilter);
        }
      });
      // }
    }
    // 2) Update the filtered map points
    if (filters.filteredRowData && filters.filteredRowData.length > 0) {
      // IMPORTANT: pass in the resulting singular sample point records to the map
      // TODO: Add a summary calculation of the lab results to pass in along with these sample point records in order to
      //  determine how the sample points need to be symbolized
      const filteredSamplePoints = [];
      this.projectSamplesRowData.forEach((samplePoint) => {
        filters.filteredRowData.forEach((labResult) => {
          if (labResult.Samp_No === samplePoint.Samp_No && !filteredSamplePoints.includes(samplePoint)) {
            // add MDL value to sample point attributes
            labResult.Result ? samplePoint.Result = labResult.Result : samplePoint.Result = 0;
            filteredSamplePoints.push(samplePoint);
          }
        });
      });

      this.geoPointsArray = this.getLatLongRecords(filteredSamplePoints);
      // set MDL min and max range

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
      this.getCombinedProjectData(this.projectIdsList);
    }
  }

  initProps(): void {
    this.selectedProjectIDs = [];
    this.projectsList = [];
    this.projectIdsList = [];
    this.clearQueryParams();
    this.agGridActiveFilters = [];
    this.mapSymbolFields = [];
    this.mapSymbolDefinitions = [];
    this.mdlThreshold.setValue(null);
  }

  removeActiveFilter(filter: ActiveFilter): void {
    const index = this.agGridActiveFilters.indexOf(filter);
    if (index >= 0) {
      this.agGridActiveFilters.splice(index, 1);
      this.agGridActiveFilters = this.agGridActiveFilters.slice();
      this.clearQueryParam(filter);
      // update filters in Ag Grid
      this.updateFilters.next(this.agGridActiveFilters);
    }
  }

  checkReadyToSymbolizeMapPoints() {
    const symbolizationFilters = ['Analyte'];
    const symbolizationFiltersFound = this.agGridActiveFilters.filter(f => {
      return symbolizationFilters.includes(f.alias);
    });
    if (symbolizationFiltersFound.length === 1) {
      this.isReadyToSymbolizeMapPoints = true;
    } else {
      this.isReadyToSymbolizeMapPoints = false;
      // clear map symbolization
      this.scribeDataExplorerService.mdlValueSource.next(undefined);
    }
  }

  agGridRowSelected(val) {
    const pointsWithGeo = this.geoPointsArray.filter(x => val.includes(x.Samp_No) && x.Latitude && x.Longitude);
    if (pointsWithGeo.length > 0) {
      this.selectedPoints = val;
      this.isMapPointsSelected = true;
    } else {
      this.snackBar.open('Selection has no geospatial point', null, {duration: 1000});
      this.isMapPointsSelected = false;
    }
  }

  mapGeoFeaturesLoaded(val) {
  }

  async getCombinedProjectData(projectIds) {
    let combinedSamplePointRowData = [];
    this.isLoadingData = true;
    this.isMapPointsSelected = false;
    // combine all project sample point and lab results data
    const projectsSamplePoints = await Promise.all(projectIds.map(async (projectId) => {
      const rows = await this.scribeDataExplorerService.getProjectSamples(projectId);
      return rows;
    }));
    // combine lab results
    const projectsLabResults = await Promise.all(projectIds.map(async (projectId) => {
      const rows = await this.scribeDataExplorerService.getProjectLabResults(projectId);
      return rows;
    }));
    combinedSamplePointRowData = [].concat(...projectsSamplePoints);
    this.combinedLabResultRowData = [].concat(...projectsLabResults);
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
        this.projectLabResultsColDefs = [...samplePointCols,
          ...this.setAgGridColumnProps(this.combinedLabResultRowData, addedSamplePointColIDs)];
        this.projectLabResultsRowData = this.mergeAllSamplesAndLabResults(this.projectSamplesRowData, this.combinedLabResultRowData);
        this.missingGeoPointsCount = this.getMissingGeoPoints(this.projectSamplesRowData, this.combinedLabResultRowData);
      }
      // set ag-grid select filter properties
      this.setAgGridSelectFilters();
      this.showTable = true;
    } else {
      this.showTable = false;
    }
    this.isLoadingData = false;
  }

  setProjects(event) {
    event.stopPropagation();
    if (this.projectIdsList.length) {
      const newselectedProjectIDs = this.projectIdsList.join(',');
      this.setQueryParam('projects', newselectedProjectIDs);
      this.getCombinedProjectData(this.projectIdsList);
      // const currentselectedProjectIDs = this.route.snapshot.queryParams.projects;
      // if (!currentselectedProjectIDs) {
      //   this.setQueryParam('projects', newselectedProjectIDs);
      // } else {
      //   if (newselectedProjectIDs !== currentselectedProjectIDs) {
      //     const queryParams = {};
      //     Object.keys(this.route.snapshot.queryParams).filter(k => k === 'projects').forEach(key => {
      //       queryParams[key] = newselectedProjectIDs;
      //     });
      //     this.router.navigate([], {queryParams});
      //   }
      // }
    }
    else {
      this.clearProjects();
    }
  }

  clearProjects(event = null) {
    if (event) {
      event.stopPropagation();
    }
    this.initProps();
    // disable the table and map components
    this.showTable = false;
    this.geoPointsArray = [];
  }

  async onTabChange(tabId) {
    this.selectedTab = tabId;
    if (this.projectIdsList.length) {
      try {
        // clear filters and get tab data
        this.agGridActiveFilters = [];
        this.updateFilters.next([]);
        this.scribeDataExplorerService.clearMapSelectionSource.next(true);
        await this.getCombinedProjectData(this.projectIdsList);
      } catch (err) {
        this.isLoadingData = false;
        this.showTable = false;
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

  mergeAllSamplesAndLabResults(samplePoints, labResults) {
    const rowDataMerged = [];
    labResults.forEach(result => {
      rowDataMerged.push({
        ...result, ...(samplePoints.find((point) =>
          point.Samp_No === result.Samp_No))
      });
    });
    return rowDataMerged;
  }

  mergeSelectedSamplesAndLabResults(selectedSamplePoints, labResults) {
    const rowDataMerged = [];
    labResults.forEach(result => {
      const found = selectedSamplePoints.find((point) => {
        if (point.Samp_No === result.Samp_No) {
          return point;
        }
      });
      if (found) {
        rowDataMerged.push({...result, ...found});
      }
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

  setAgGridSelectFilters() {
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
      const colNames = Object.keys(results[0]);
      colNames.forEach((key) => {
        if (!addedColIDs.includes(key)) {
          let headerName;
          let hide;
          if (CONFIG_SETTINGS.defaultColumnSettings.hasOwnProperty(key)) {
            headerName = CONFIG_SETTINGS.defaultColumnSettings[key].alias;
            hide = CONFIG_SETTINGS.defaultColumnSettings[key].hide;
          } else {
            headerName = key.replace(/_/g, ' ');
            hide = false;
          }
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
        const newActiveFilter = {
          field: paramKey,
          queryParam: agGridFilterDefinitions[paramKey].queryParam,
          alias: CONFIG_SETTINGS.defaultColumnSettings[paramKey].alias,
          operand: CONFIG_SETTINGS.displayFilterOperators[agGridFilterDefinitions[paramKey].relationalOperator],
          value: agGridFilterDefinitions[paramKey].value,
        };
        this.agGridActiveFilters = [...this.agGridActiveFilters, newActiveFilter];
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
      const operandMatch = Object.keys(CONFIG_SETTINGS.agGridRelationalOperators).find((operandKey) => {
        if (paramKey.endsWith(operandKey)) {
          return CONFIG_SETTINGS.agGridRelationalOperators[operandKey];
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
            relationalOperator: CONFIG_SETTINGS.agGridRelationalOperators[operandMatch],
            value: queryParamsClone[paramKey]
          };
        } else {
          // default to equals operand
          queryFilterParams[columnField] = {
            queryParam: paramKey.trim(),
            relationalOperator: 'equals',
            value: queryParamsClone[paramKey]
          };
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

  onPublishAGOLBtnClick() {
    let selectedProjects: Project[];
    this.scribeDataExplorerService.isPublishingToAGOL.next(true);
    selectedProjects = this.userProjects.filter((project: Project) => {
      return this.projectIdsList.includes(project.projectid);
    });
    // set feature layer title: "[Project name] ([Number]) Scribe Project Feature Layer"
    const staticText = 'Scribe Project Feature Layer';
    const selectedTab = this.tabs[this.selectedTab].replace(/ /g, '_');
    const title = `${selectedProjects[0].project_name} (${selectedProjects[0].projectid}) ${staticText}`;
    // set feature layer description: Project names and current filters list
    const selectedProjectNames = selectedProjects.map(selectedProject => selectedProject.project_name).join(', ');
    const activeFilterNames = this.agGridActiveFilters.map(activeFilter => {
      return `${activeFilter.field} ${activeFilter.operand} ${activeFilter.value}`;
    }).join(', ');
    const description = `Projects: [${selectedProjectNames}], Filters: [${activeFilterNames}]`;
    if (this.selectedTab === 0) {
      this.publishLabResultsToAGOL.next({title, description});
    }
    if (this.selectedTab === 1) {
      this.publishSamplePointLocationsToAGOL.next({title, description});
    }
  }

  onExportCSVBtnClick() {
    // set ag grid title
    const selectedTab = this.tabs[this.selectedTab].replace(/ /g, '_');
    const title = 'Projects_' + this.projectIdsList.join('_') + '_' + selectedTab;
    if (this.selectedTab === 0) {
      this.exportLabResultsCSV.next(title);
    }
    if (this.selectedTab === 1) {
      this.exportSamplePointLocationCSV.next(title);
    }
  }

  onClearMapSelection() {
    this.scribeDataExplorerService.clearMapSelectionSource.next(true);
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
      queryParams[key] = null;
    });
    this.router.navigate([], {queryParams});
  }

  onResize(event) {
    this.colsSpan = (event.target.innerWidth > 1050) ? 1 : 2;
  }

  // perform the search by id, Name, Site#, Site State, NPL Status, Description, Epa Region# or Epa Contact
  // private _filter(value: string): ProjectExplorer[] {
  //   const filterValue = value.toString().toLowerCase(); // use of toString cause value will be an observable
  //   return this.userExploredProjects.filter(project => {
  //     return project.project_name?.toLowerCase().includes(filterValue) ||
  //       project.projectid.toString().includes(filterValue) ||
  //       project.Site_No?.toLowerCase().includes(filterValue) ||
  //       project.Site_State?.toLowerCase().includes(filterValue) ||
  //       project.NPL_Status?.toLowerCase().includes(filterValue) ||
  //       project.Description?.toLowerCase().includes(filterValue) ||
  //       project.EPARegionNumber?.toLowerCase().includes(filterValue) ||
  //       project.EPAContact?.toLowerCase().includes(filterValue);
  //   });
  // }

  add(event: MatChipInputEvent): void {
    let projectInAutocomplete: ProjectExplorer;
    this.filteredProjects.subscribe(projects => {
      if (projects.length === 1) {
        projectInAutocomplete = projects[0];
        this.addProject(projectInAutocomplete);
        this.addId(projectInAutocomplete.projectid);
        event.input.value = '';
      }
    });
  }

  // remove both the project and the project id from their respective list
  async remove(project: Project){
    const index = this.projectsList.indexOf(project);
    if (index >= 0) {
      this.projectsList.splice(index, 1);
      this.projectIdsList.splice(index, 1);
    }
    if (this.projectIdsList.length > 0) {
      await this.getCombinedProjectData(this.projectIdsList);
    }
    else {
      this.clearProjects();
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const projectToAdd = {projectid: event.option.value, project_name: event.option.viewValue};
    this.addProject(projectToAdd);
    this.addId(projectToAdd.projectid);
    this.projectInput.nativeElement.value = '';
    this.projectCtrl.setValue(null);
  }

  // setFilter() {
  //   this.filteredProjects = this.projectCtrl.valueChanges.pipe(
  //   map((val?: string) => (val ? this._filter(val) : this.userExploredProjects.slice())),
  //   );
  // }

  setFilter() {
    this.projectCtrl.valueChanges.subscribe(val => {
      this.filteredProjects =  this.scribeDataExplorerService.getUserFilteredProjects(val);
    });
  }

  async addId(id: number) {
    if (!this.projectIdsList.includes(id)) {
      this.projectIdsList.push(id);
    }
    await this.getCombinedProjectData(this.projectIdsList);
  }

  addProject(project: Project) {
    if (!this.projectIdsList.includes(project.projectid)) {
      this.projectsList.push(project);
    }
  }
}
