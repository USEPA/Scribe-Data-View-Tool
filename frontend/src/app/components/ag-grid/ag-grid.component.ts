import {Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import {AgGridSelectFilterComponent} from '@components/ag-grid/ag-grid-select-filter.component';
import {ColDef} from 'ag-grid';
import {Observable, Subscription} from 'rxjs';
import {Filters, ActiveFilter} from '../../filters';

@Component({
  selector: 'app-ag-grid',
  templateUrl: './ag-grid.component.html',
  styleUrls: ['./ag-grid.component.css']
})
export class AgGridComponent implements OnInit, OnDestroy {
  @Output() gridReadyEvent = new EventEmitter<any>();
  @Output() filtersChangedEvent = new EventEmitter<{activeFilters: any[], filteredRowData: any[]}>();
  @Output() rowSelectedEvent = new EventEmitter<number>();
  public showGrid: boolean;
  private gridApi;
  private gridColumnApi;
  private defaultColDef;
  private overlayLoadingTemplate;
  private customComponents: object;
  private _isLoading: boolean;
  private _columnDefs: any;
  private _activeFilters: ActiveFilter[];
  private updatingColDefsSubscription: Subscription;
  private settingFiltersSubscription: Subscription;
  private updatingFiltersSubscription: Subscription;
  private exportingCSVSubscription: Subscription;

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
  @Input() exportingCSV: Observable<string>;

  constructor() {
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
    if (this.settingFilters) {
      this.settingFiltersSubscription = this.settingFilters.subscribe((presetFilters) => {
        this.setFilters(presetFilters);
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
    if (this.exportingCSV) {
      this.exportingCSVSubscription = this.exportingCSV.subscribe((title) => this.exportCSV(title));
    }
    // Set custom filter properties for column definitions
    if (this.columnDefs && this.customFilterProps) {
      this.setColDefFilterProps();
    }
  }

  ngOnDestroy() {
    this.updatingColDefsSubscription.unsubscribe();
    this.updatingFiltersSubscription.unsubscribe();
    this.exportingCSVSubscription.unsubscribe();
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
    const allColumnIds = [];
    if (this.gridColumnApi && this.gridColumnApi.getAllColumns()) {
      this.gridColumnApi.getAllColumns().forEach((column) => {
        allColumnIds.push(column.colId);
      });
      this.gridColumnApi.autoSizeColumns(allColumnIds);
      this.gridReadyEvent.emit(this.columnDefs);
    }
  }

  onFiltersChanged(params) {
    const activeFilters = params.api.getFilterModel();
    // get active filters and their values
    const activeFilterValues = [];
    for (const key of Object.keys(activeFilters)) {
      if (activeFilters[key].filterType === 'date') {
        if (activeFilters[key].condition1) {
          activeFilterValues.push({name: key,
            value: `${activeFilters[key].condition1.dateFrom}...`});
        } else {
          activeFilterValues.push({name: key, value: activeFilters[key].dateFrom});
        }
      } else if (activeFilters[key].value) {
        activeFilterValues.push({name: key, value: activeFilters[key].value});
      } else if (activeFilters[key].filter) {
        activeFilterValues.push({name: key, value: activeFilters[key].filter});
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

  setFilters(presetFilters) {
    // Set preset filters for the filter model after ag grid has loaded
    try {
      if (this.gridApi) {
        for (const filterName of Object.keys(presetFilters)) {
          const filterComponent = this.gridApi.getFilterInstance(filterName);
          if (filterComponent) {
            filterComponent.setModel({
              type: presetFilters[filterName].type,
              value: presetFilters[filterName].value ? presetFilters[filterName].value : '',
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
      const activeFilters = this.gridApi.getFilterModel();
      if (Object.keys(activeFilters).length > 0) {
        if (filters === undefined || filters.length === 0) {
          // clear all filters
          this.gridApi.setFilterModel(null);
        } else {
          // remove the deselected filters from the current filter model and reset the model
          const currentFilterNames = filters.map(f => f.name);
          for (const filterName of Object.keys(activeFilters)) {
            if (!currentFilterNames.includes(filterName)) {
              delete activeFilters[filterName];
            }
          }
          this.gridApi.setFilterModel(activeFilters);
        }
      }
    } catch (err) {
      return;
    }
  }

  onSelectionChanged(params) {
    const selectedRows = this.gridApi.getSelectedRows();
    this.rowSelectedEvent.emit(selectedRows[0]);
  }

  onModelUpdated(params) {
    // params.api.sizeColumnsToFit();
    // params.api.autoSizeColumns();
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    // this.resizeColumns();
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

  exportCSV(title) {
    const params = {
      columnGroups: true,
      allColumns: true,
      fileName: title,
    };
    this.gridApi.exportDataAsCsv(params);
  }
}
