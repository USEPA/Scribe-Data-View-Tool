export interface FiltersInterfaceTypes {
  activeFilters: ActiveFilter[];
  filteredRowData: any[];
}

export interface ActiveFilter {
  field: string;
  queryParam: string;
  alias: string;
  operand: string;
  value: string;
}
