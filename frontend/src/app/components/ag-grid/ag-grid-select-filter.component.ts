import {Component, ViewChild, ViewContainerRef} from '@angular/core';
import {
  IDoesFilterPassParams,
  IFilterParams,
  RowNode,
  ValueGetterFunc,
  ValueGetterParams
} from '@ag-grid-community/all-modules';
import {IFilterAngularComp} from '@ag-grid-community/angular';

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
  private valueGetter: ValueGetterFunc;
  public selectFilterValues: string[];
  public selectedFilterVal = '';

  // @ts-ignore
  @ViewChild('input', {read: ViewContainerRef}) public input;

  agInit(params: ExtendedFilterParams): void {
    this.params = params;
    this.valueGetter = params.valueGetter;
    this.selectFilterValues = params.values.sort((a, b) => {
      return a.localeCompare(b, 'en', {sensitivity: 'base'});
    });
  }

  isFilterActive(): boolean {
    return this.selectedFilterVal !== null && this.selectedFilterVal !== undefined && this.selectedFilterVal !== '';
  }

  doesFilterPass(params: ValueGetterParams): boolean {
    return this.selectedFilterVal.toLowerCase()
      .split(' ')
      .every((filterWord) => {
        const filterVal = this.valueGetter(params);
        if (filterVal) {
          return this.valueGetter(params).toString().toLowerCase().indexOf(filterWord) >= 0;
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
