import {Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import { AgGridSelectFilterComponent } from '@components/ag-grid/ag-grid-select-filter.component';
import {ColDef} from 'ag-grid';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-ag-grid',
  templateUrl: './ag-grid.component.html',
  styleUrls: ['./ag-grid.component.css']
})
export class AgGridComponent implements OnInit, OnDestroy {
  @Output() rowSelectedEvent = new EventEmitter<number>();
  public showGrid: boolean;
  private gridApi;
  private gridColumnApi;
  private defaultColDef;
  private overlayLoadingTemplate;
  private customComponents: object;
  private updatingColDefsSubscription: Subscription;
  private exportingCSVSubscription: Subscription;
  private _isLoading: boolean;
  private _columnDefs: any;

  // Inputs
  @Input() set isLoading(value: boolean) {
    this._isLoading = value;
    if (this._isLoading) {
      this.showLoading();
    } else {
      // Set custom filter properties for column definitions after Ag Grid has loaded
      if (this.customFilterProps) {
        this.setColDefFilterProps();
      }
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
  @Input() exportingCSV: Observable<string>;

  constructor() {
    this.showGrid = true;
    this.defaultColDef = {
      autoHeight: true,
      resizable: true
    };
    this.overlayLoadingTemplate = '<span class="ag-overlay-loading-center">Please wait while loading data</span>';
    this.customComponents = { selectFilter: AgGridSelectFilterComponent };
  }

  ngOnInit() {
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
  }

  ngOnDestroy() {
    this.updatingColDefsSubscription.unsubscribe();
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
    this.resizeColumns();
  }

  /*ngOnChanges(changes: SimpleChanges) {
    if (changes.isLoading) {
      if (changes.isLoading.currentValue) {
        this.showLoading();
      } else {
        // Set custom filter properties for column definitions after Ag Grid has loaded
        if (this.customFilterProps) {
          this.setColDefFilterProps();
        }
        this.hideLoading();
      }
    }
  }*/

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
