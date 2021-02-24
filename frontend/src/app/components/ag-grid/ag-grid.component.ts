import {Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {ColDef, ClientSideRowModelModule, CsvExportModule} from '@ag-grid-community/all-modules';

import {ScribeDataExplorerService} from '@services/scribe-data-explorer.service';
import {AgGridSelectFilterComponent} from '@components/ag-grid/ag-grid-select-filter.component';
import {ActiveFilter} from '../../filtersInterfaceTypes';
import {AGOLService} from '../../projectInterfaceTypes';


@Component({
  selector: 'app-ag-grid',
  templateUrl: './ag-grid.component.html',
  styleUrls: ['./ag-grid.component.css']
})
export class AgGridComponent implements OnInit, OnDestroy, OnChanges {
  @Output() gridReadyEvent = new EventEmitter<any>();
  @Output() filtersChangedEvent = new EventEmitter<{ activeFilters: any[], filteredRowData: any[] }>();
  @Output() rowSelectedEvent = new EventEmitter<any[]>();
  public showGrid: boolean;
  private gridApi;
  private gridColumnApi;
  public defaultColDef;
  public overlayLoadingTemplate;
  public customComponents: object;
  private _isLoading: boolean;
  private _columnDefs: any;
  private _activeFilters: ActiveFilter[];
  private updatingColDefsSubscription: Subscription;
  private settingFiltersSubscription: Subscription;
  private updatingFiltersSubscription: Subscription;
  public modules = [ClientSideRowModelModule, CsvExportModule];

  // Inputs
  @Input() set isLoading(value: boolean) {
    this._isLoading = value;
    if (this._isLoading) {
      this.showLoading();
    } else {
      this.hideLoading();
    }
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  @Input('columnDefs')
  set columnDefs(value: any) {
    if (value.length > 0) {
      this._columnDefs = value;
    }
  }

  get columnDefs(): any {
    return this._columnDefs;
  }

  @Input() rowData: any[];
  @Input() customFilterProps: object;
  @Input() updatingColDefs: Observable<any>;
  @Input() settingFilters: Observable<any>;
  @Input() updatingFilters: Observable<any>;
  @Input() publishingToAGOL: Observable<{ title: string, description: string }>;
  @Input() exportingCSV: Observable<string>;
  @Input() selectedFeatures: string[];
  @Output() selectedFeaturesChange: EventEmitter<string[]> = new EventEmitter<string[]>();

  constructor(public scribeDataExplorerService: ScribeDataExplorerService) {
    this.showGrid = true;
    this.defaultColDef = {
      autoHeight: true,
      resizable: true
    };
    this.overlayLoadingTemplate = '<span class="ag-overlay-loading-center">Please wait while loading data</span>';
    this.customComponents = {selectFilter: AgGridSelectFilterComponent};
  }

  ngOnInit() {
    // Subscribe to observable events

    // subscribe to table filtering and column events
    if (this.settingFilters) {
      this.settingFiltersSubscription = this.settingFilters.subscribe((presetFilters) => {
        this.setPresetFilters(presetFilters);
      });
    }
    if (this.updatingFilters) {
      this.updatingFiltersSubscription = this.updatingFilters.subscribe((filters) => {
        this.updateActiveFilters(filters);
      });
    }
    if (this.updatingColDefs) {
      this.updatingColDefsSubscription = this.updatingColDefs.subscribe((values) => {
        this.columnDefs = values;
        // set column visibility
        this.columnDefs.forEach((column) => {
          this.gridColumnApi.setColumnVisible(column.field, !column.hide);
        });
      });
    }
    // subscribe to map component events

    // subscribe to data exporting events
    this.publishingToAGOL.subscribe((featureLayerInfo) => {
      if (featureLayerInfo) {
        this.publishToAGOL(featureLayerInfo).then(async () => {
          // update user's published AGOL services list
          await this.scribeDataExplorerService.getPublishedAGOLServices().then((items: AGOLService[]) => {
            this.scribeDataExplorerService.userAGOLServices.next(items);
          });
        });
      }
    });
    this.exportingCSV.subscribe((title) => {
      if (title) {
        this.exportCSV(title);
      }
    });

    // Set custom filter properties for column definitions
    if (this.columnDefs && this.customFilterProps) {
      this.setColDefFilterProps();
    }
  }

  ngOnDestroy() {
    this.updatingColDefsSubscription.unsubscribe();
    this.updatingFiltersSubscription.unsubscribe();
    this.gridApi.destroy();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedFeatures !== undefined && changes.selectedFeatures.currentValue) {
      if (changes.selectedFeatures.previousValue === undefined ||
          !changes.selectedFeatures.currentValue.every(x => changes.selectedFeatures.previousValue.includes(x))) {
        // on map point selected / clicked, select corresponding table rows
        if (this.gridApi) {
          this.gridApi.deselectAll();
          let rowIndex = 0;
          this.gridApi.forEachNode((node) => {
            const found = changes.selectedFeatures.currentValue.find(x => x === node.data.Samp_No);
            if (found) {
              node.setSelected(true, false, true);
              rowIndex = node.rowIndex;
              this.gridApi.ensureIndexVisible(rowIndex, 'middle');
            }
          });
        }
      }
    }
  }

  showLoading() {
    if (this.gridApi) {
      this.gridApi.showLoadingOverlay();
    }
  }

  hideLoading() {
    if (this.gridApi) {
      this.gridApi.hideOverlay();
    }
  }

  resizeColumns() {
    const allColumnIds = [];
    if (this.gridColumnApi && this.gridColumnApi.getAllColumns()) {
      this.gridColumnApi.getAllColumns().forEach((column) => {
        allColumnIds.push(column.colId);
      });
      this.gridColumnApi.autoSizeColumns(allColumnIds);
    }
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    if (this.gridColumnApi && this.gridColumnApi.getAllColumns()) {
      // this.resizeColumns();
      this.gridColumnApi.autoSizeAllColumns();
      this.gridReadyEvent.emit(this.columnDefs);
    }
  }

  onModelUpdated(params) {
    // params.api.sizeColumnsToFit();
    // params.api.autoSizeColumns();
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  onFiltersChanged(params) {
    const activeFilters = params.api.getFilterModel();
    // get active filters and their values
    const activeFilterValues = [];
    for (const key of Object.keys(activeFilters)) {
      if (activeFilters[key].filterType === 'date') {
        if (activeFilters[key].condition1) {
          activeFilterValues.push({
            field: key,
            operand: 'equals',
            value: `${activeFilters[key].condition1.dateFrom}...`
          });
        } else {
          activeFilterValues.push({
            field: key,
            operand: 'equals',
            value: activeFilters[key].dateFrom
          });
        }
      } else if (activeFilters[key].filter) {
        activeFilterValues.push({
          field: key,
          operand: activeFilters[key].type ? activeFilters[key].type : 'equals',
          value: activeFilters[key].filter
        });
      } else if (activeFilters[key].value) {
        activeFilterValues.push({
          field: key,
          operand: 'equals',
          value: activeFilters[key].value
        });
      }
    }
    // get the filtered rows
    const lastFilterProps = activeFilters[Object.keys(activeFilters)[Object.keys(activeFilters).length - 1]];
    // check if last filter type is text, then have at least a length of 3 characters before returning filtered results
    if (lastFilterProps && (lastFilterProps.filterType !== 'text' ||
      (lastFilterProps.filterType === 'text' && lastFilterProps.filter.length >= 3))) {
      const filteredRows = [];
      this.gridApi.forEachNodeAfterFilter((node, index) => {
        filteredRows.push(node.data);
      });
      this.filtersChangedEvent.emit({activeFilters: activeFilterValues, filteredRowData: filteredRows});
    } else if (!activeFilters || Object.keys(activeFilters).length === 0) {
      this.filtersChangedEvent.emit({activeFilters: activeFilterValues, filteredRowData: undefined});
    }
  }

  setPresetFilters(presetFilters) {
    // Set preset filters for the filter model after ag grid has loaded
    try {
      if (this.gridApi) {
        for (const filterName of Object.keys(presetFilters)) {
          const filterComponent = this.gridApi.getFilterInstance(filterName);
          if (filterComponent) {
            filterComponent.setModel({
              type: presetFilters[filterName].type,
              value: presetFilters[filterName].value ? presetFilters[filterName].value : '',
              dateFrom: presetFilters[filterName].dateFrom ? presetFilters[filterName].dateFrom : '',
              filter: presetFilters[filterName].filter ? presetFilters[filterName].filter : null
            });
          }
        }
        const presetFilterModel = this.gridApi.getFilterModel();
        this.gridApi.setFilterModel(presetFilterModel);
      }
    } catch (err) {
      console.log(err);
    }
  }

  updateActiveFilters(filters) {
    try {
      if (filters.length > 0) {
        const activeFilters = this.gridApi.getFilterModel();
        if (Object.keys(activeFilters).length > 0) {
          // remove the deselected filters from the current filter model and reset the model
          const currentFilterNames = filters.map((f: ActiveFilter) => {
            return f.field;
          });
          for (const key of Object.keys(activeFilters)) {
            if (!currentFilterNames.includes(key)) {
              delete activeFilters[key];
            }
          }
          this.gridApi.setFilterModel(activeFilters);
        }
      } else {
        // clear all filters
        this.gridApi.setFilterModel(null);
      }
    } catch (err) {
      console.log(err);
    }
  }

  onSelectionChanged(params) {
    const selectedRows = this.gridApi.getSelectedRows();
    if (selectedRows.constructor === Array && selectedRows.length >= 0) {
      this.selectedFeatures = [...new Set(selectedRows.map(x => x.Samp_No))];
      this.selectedFeaturesChange.emit(this.selectedFeatures);
    }
  }

  setColDefFilterProps() {
    this.columnDefs.forEach((item: ColDef) => {
      if (this.customFilterProps.hasOwnProperty(item.field)) {
        item.filter = this.customFilterProps[item.field].filterName;
        item.menuTabs = ['filterMenuTab'];
        // Note: additional filter parameters can be added by setting colDef.filterParams.
        item.filterParams = {values: this.customFilterProps[item.field].filterValues};
      }
    });
  }

  async publishToAGOL(featureLayerInfo) {
    const rowData = [];
    this.gridApi.forEachNodeAfterFilter((row) => {
      rowData.push(row.data);
    });
    if (rowData.length > 0) {
      featureLayerInfo.rows = rowData;
      await this.scribeDataExplorerService.publishToAGOL(featureLayerInfo);
      this.scribeDataExplorerService.isPublishingToAGOL.next(false);
    }
  }

  exportCSV(title) {
    const params = {
      columnGroups: true,
      allColumns: true,
      fileName: title,
    };
    this.gridApi.exportDataAsCsv(params);
  }
}
