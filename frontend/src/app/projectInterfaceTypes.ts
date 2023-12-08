import DateTimeFormat = Intl.DateTimeFormat;

export interface Project {
  projectid: string;
  project_name: string;
}

export interface ProjectExplorer {
  projectid: string;
  project_name: string;
  Site_No: string;
  Site_State: string;
  NPL_Status: string;
  Description: string;
  EPARegionNumber: string;
  EPAContact: string;
}

export interface AGOLService {
  itemUrl: any;
  title: string;
  url: string;
}

export interface AGOLContentInfo {
  title: string;
  description: string;
  rows: [];
}

export interface ColumnsRows {
  columnDefs: any[];
  rowData: any[];
}

export interface ColumnDefs {
  colId: string;
  headerName: string;
  field: string;
  sortable: boolean;
  filter: string;
  filterParams?: {};
  hide: boolean;
}

export interface ProjectCentroid {
  OBJECTID: number;
  CLIENT_COMPUTERNAME: string;
  CLIENT_USERNAME: string;
  CURRENT_VERSION: number;
  EMAIL: string;
  FULL_NAME: string;
  LAST_UPDATE: number;
  ORGANIZATION: string;
  PHONE_NUMBER: string;
  PROJECTID: number;
  PROJECT_NAME: string;
  PUBLISHER_ROLE: string;
  UPDATE_TO_VERSION: number;
}

export interface ProjectLabResult {
  'LabResultsID': number;
  'Site_No': string;
  'Samp_No': string;
  'Matrix_ID': string;
  'Sample_Type_Code': string;
  'SubSample_Amount': number;
  'SubSample_Amount_Unit': string;
  'Analysis': string;
  'AnalysisGroup': string;
  'Analyte': string;
  'Analyte_FinalName': string;
  'Analytical_Method': string;
  'Result': number;
  'Result_Modifier': string;
  'Result_Qualifier': string;
  'Result_Text': string;
  'Result_Type_Code': string;
  'Result_Units': string;
  'Date_Analyzed': DateTimeFormat;
  'Date_Collected': DateTimeFormat;
  'Date_Edit': DateTimeFormat;
  'Date_Extracted': DateTimeFormat;
  'Date_Input': DateTimeFormat;
  'Date_Received': DateTimeFormat;
  'Basis': string;
  'CAS_NO': string;
  'Comments': string;
  'Detected': string;
  'Dilution_Factor': number;
  'EDD_File_Name': string;
  'Edited_By': string;
  'Extraction_Method': string;
  'Final_Volume': number;
  'Final_Volume_Unit': string;
  'Lab_Batch_No': string;
  'Lab_Coc_No': string;
  'Lab_Location_ID': string;
  'Lab_Name': string;
  'Lab_Result_Qualifier': string;
  'Lab_Samp_No': string;
  'MDL': number;
  'MDL_Units': string;
  'Percent_Lipids': number;
  'Percent_Moisture': number;
  'Percent_Recovery': number;
  'Percent_Solids': number;
  'QA_Comment': string;
  'QA_Date': DateTimeFormat;
  'QA_UserName': string;
  'QAFlag': number;
  'QC_Type': string;
  'Quantitation_Limit': number;
  'Quantitation_Limit_Units': string;
  'Reportable_Result': string;
  'Reporting_Limit': number;
  'Reporting_Limit_Units': string;
  'Test_Type': string;
  'Total_Or_Disolved': string;
  'Validation_Level': string;
  'Region_Tag_Prefix': string;
}

export interface ProjectSample {
  Area: string;
  Contractor: string;
  EPA_Region: string;
  Location: string;
  Location_Desc: string;
  Latitude: number;
  Longitude: number;
  Sample_Depth: number;
  Sample_Depth_To: number;
  Sample_Depth_Units: string;
  Sample_Date: string;
  Samp_No: string;
  Substance_Type: string;
  Sample_Type: string;
  Site_Name: string;
  Site_Number: string;
  State: string;
  LabResultsAvailable: boolean;
  Numeric_Tags: any;
  MDL: number;
  Result: number;
  projectid: string;
}

export interface MapSymbolizationProps {
  sampleType: string;
  min: number;
  max: number;
  threshold: number;
}

export interface MapSymbol {
  value: number;
  color: string;
  label: string;
}

export interface Feature {
  type: string;
  geometry: {
    type: string,
    coordinates: any,
  };
  properties: any;
}

export interface FeatureCollection {
  type: string;
  features: Feature[];
}
