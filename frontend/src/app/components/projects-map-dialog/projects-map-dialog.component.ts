import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {VisibleColumnsDialogComponent} from '@components/visible-columns-dialog/visible-columns-dialog.component';


@Component({
  selector: 'app-projects-map-dialog',
  templateUrl: './projects-map-dialog.component.html',
  styleUrls: ['./projects-map-dialog.component.css']
})
export class ProjectsMapDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<VisibleColumnsDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
  }

  mapGeoFeaturesLoaded(val) {
    console.log(val);
  }

  confirm() {
    this.dialogRef.close({done: true, columns: this.data.columns});
  }

  dismiss() {
    this.dialogRef.close({done: false});
  }

}
