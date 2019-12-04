import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-ag-grid',
  templateUrl: './ag-grid.component.html',
  styleUrls: ['./ag-grid.component.css']
})
export class AgGridComponent implements OnChanges {
  public showGrid: boolean;
  private gridApi;
  private gridColumnApi;
  private defaultColDef;

  @Input() columnDefs: any[];
  @Input() rowData: any[];

  constructor() {
    this.showGrid = true;
    this.defaultColDef = {
      autoHeight: true,
      resizable: true
    };
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

  onModelUpdated(params) {
    params.api.sizeColumnsToFit();
    // params.api.autoSizeColumns();
    const allColumnIds = [];
    if (this.gridColumnApi) {
      this.gridColumnApi.getAllColumns().forEach((column) => {
        allColumnIds.push(column.colId);
      });
      this.gridColumnApi.autoSizeColumns(allColumnIds);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
  }

}
