import { Component, Inject, OnInit } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormControl, Validators} from '@angular/forms';
import {ColumnDefs} from '../../projectDataTypes';

@Component({
  selector: 'app-visible-columns-dialog',
  templateUrl: './visible-columns-dialog.component.html',
  styleUrls: ['./visible-columns-dialog.component.css']
})
export class VisibleColumnsDialogComponent implements OnInit {
  visibleColumns: ColumnDefs[];
  constructor(public dialogRef: MatDialogRef<VisibleColumnsDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    this.visibleColumns = data.columns;
  }

  ngOnInit() {
  }

  confirm() {
    this.dialogRef.close({done: true, columns: this.data.columns});
  }

  dismiss() {
    this.dialogRef.close({done: false});
  }

}
