import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ReplaySubject} from 'rxjs';
import {ProjectSample} from '@services/sadie-projects.service';

@Component({
  selector: 'app-update-row-dialog',
  templateUrl: './update-row-dialog.component.html',
  styleUrls: ['./update-row-dialog.component.css']
})
export class UpdateRowDialogComponent implements OnInit {
  addPointForm: FormGroup = new FormGroup({
    latitude: new FormControl(0, Validators.required),
    longitude: new FormControl(0, Validators.required),
    locationComment: new FormControl(''),
  });
  point: ReplaySubject<ProjectSample> = new ReplaySubject<ProjectSample>();
  constructor(public dialogRef: MatDialogRef<UpdateRowDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    if (this.data.action === 'addPoint') {
      const point = this.data.items[0];
      this.addPointForm.patchValue(point);
      this.point.next(point);
    }
  }

  confirm() {
    let data;
    if (this.data.action === 'addPoint') {
      data = this.addPointForm.value;
    }
    this.dialogRef.close({done: true, data});
  }

  dismiss() {
    this.dialogRef.close({done: false});
  }

}
