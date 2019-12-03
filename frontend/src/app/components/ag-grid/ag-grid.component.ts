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
    this.defaultColDef = { resizable: true };
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  onModelUpdated(params) {
    params.api.sizeColumnsToFit();
  }

  ngOnChanges(changes: SimpleChanges) {
  }

}
