export interface Filters {
  activeFilters: ActiveFilter[];
  filteredRowData: any[];
}

export interface ActiveFilter {
  name: string;
  value: string;
}
