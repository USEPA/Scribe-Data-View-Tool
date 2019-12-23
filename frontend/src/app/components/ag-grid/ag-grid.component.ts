import {Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges} from '@angular/core';
import { AgGridSelectFilterComponent } from '@components/ag-grid/ag-grid-select-filter.component';
import {ColDef} from 'ag-grid';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-ag-grid',
  templateUrl: './ag-grid.component.html',
  styleUrls: ['./ag-grid.component.css']
})
export class AgGridComponent implements OnInit, OnDestroy, OnChanges {
  public showGrid: boolean;
  private gridApi;
  private gridColumnApi;
  private defaultColDef;
  private overlayLoadingTemplate;
  private customComponents: object;
  private exportingCSVSubscription: Subscription;

  @Input() isLoading: boolean;
  @Input() columnDefs: any[];
  @Input() rowData: any[];
  @Input() customFilterProps: object;
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
    if (this.exportingCSV) {
      this.exportingCSVSubscription = this.exportingCSV.subscribe((title) => this.exportCSV(title));
    }
  }

  ngOnDestroy() {
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
    if (this.gridColumnApi) {
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
    this.gridColumnApi.getAllColumns().forEach((column) => {
      allColumnIds.push(column.colId);
    });
    this.gridColumnApi.autoSizeColumns(allColumnIds);
  }

  onRowDataChanged(params) {
  }

  onModelUpdated(params) {
    // params.api.sizeColumnsToFit();
    // params.api.autoSizeColumns();
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.resizeColumns();
  }

  ngOnChanges(changes: SimpleChanges) {
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
