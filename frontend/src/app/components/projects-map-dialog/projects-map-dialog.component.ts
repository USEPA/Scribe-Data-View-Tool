import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

import {VisibleColumnsDialogComponent} from '@components/visible-columns-dialog/visible-columns-dialog.component';
import {ScribeDataExplorerService} from '@services/scribe-data-explorer.service';
import {ProjectCentroid} from '../../projectInterfaceTypes';


@Component({
  selector: 'app-projects-map-dialog',
  templateUrl: './projects-map-dialog.component.html',
  styleUrls: ['./projects-map-dialog.component.css']
})
export class ProjectsMapDialogComponent implements OnInit {
  selectedProjectCentroids: ProjectCentroid[];
  selectedProjectNames = '';

  constructor(public dialogRef: MatDialogRef<VisibleColumnsDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              public scribeDataExplorerService: ScribeDataExplorerService) { }

  ngOnInit() {

  }

  mapGeoFeaturesLoaded(val) {
    console.log(val);
  }

  confirm() {
    this.dialogRef.close({done: true, data: this.selectedProjectCentroids});
  }

  dismiss() {
    this.dialogRef.close({done: false});
  }

  selectProject(selectedProjects) {
    this.selectedProjectNames = selectedProjects.map((projectCentroid) => {
      return projectCentroid.PROJECT_NAME;
    }).join(', ');
    this.selectedProjectCentroids = selectedProjects;
  }
}
