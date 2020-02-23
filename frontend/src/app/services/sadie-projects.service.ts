import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import DateTimeFormat = Intl.DateTimeFormat;

export interface Project {
  projectid: number;
  project_name: string;
}

export interface ColumnsRows {
  columnDefs: any[];
  rowData: any[];
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
}

export interface ProjectSample {
  Area: string;
  Contractor: string;
  EPA_Region: string;
  Location: string;
  Location_Desc: string;
  Lat: number;
  Long: number;
  Sample_Depth: number;
  Sample_Depth_To: number;
  Sample_Depth_Units: string;
  Sample_Date: string;
  Sample_Number: string;
  Substance_Type: string;
  Sample_Type: string;
  Site_Name: string;
  Site_Number: string;
  State: string;
}


@Injectable({
  providedIn: 'root'
})
export class SadieProjectsService {

  constructor(private http: HttpClient, public router: Router) {}

  async getUserProjects() {
    return await this.http.get<Project[]>('projects').toPromise();
  }

  async getProjectSamples(projectId: string) {
    return await this.http.get<ColumnsRows>(`projects/PID_${projectId}/samples`).toPromise();
  }

  async getProjectLabResults(projectId: string) {
    return await this.http.get<ProjectLabResult[]>(`PID_${projectId}/PID_${projectId}_LabResults`).toPromise();
  }

}
