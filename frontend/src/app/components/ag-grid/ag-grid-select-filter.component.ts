import {Component, ViewChild, ViewContainerRef} from '@angular/core';
import {IDoesFilterPassParams, IFilterParams, RowNode} from 'ag-grid-community/main';
import {IFilterAngularComp} from 'ag-grid-angular/main';

interface ExtendedFilterParams extends IFilterParams {
  values: string[];
}

@Component({
  selector: 'app-ag-grid-select-filter',
  templateUrl: './ag-grid-select-filter.component.html',
  styleUrls: ['./ag-grid-select-filter.component.css']
})
export class AgGridSelectFilterComponent implements IFilterAngularComp {
  private params: ExtendedFilterParams;
  private valueGetter: (rowNode: RowNode) => any;
  public selectFilterValues: string[];
  public selectedFilterVal = '';

  // @ts-ignore
  @ViewChild('input', {read: ViewContainerRef}) public input;

  agInit(params: ExtendedFilterParams): void {
    this.params = params;
    this.valueGetter = params.valueGetter;
    this.selectFilterValues = params.values;
  }

  isFilterActive(): boolean {
    return this.selectedFilterVal !== null && this.selectedFilterVal !== undefined && this.selectedFilterVal !== '';
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    return this.selectedFilterVal.toLowerCase()
      .split(' ')
      .every((filterWord) => {
        const filterVal = this.valueGetter(params.node);
        if (filterVal) {
          return this.valueGetter(params.node).toString().toLowerCase().indexOf(filterWord) >= 0;
        } else {
          return false;
        }
      });
  }

  getModel(): any {
    return {value: this.selectedFilterVal};
  }

  setModel(model: any): void {
    this.selectedFilterVal = model ? model.value : '';
  }

  onChange(newValue): void {
    this.params.filterChangedCallback();
  }
}
