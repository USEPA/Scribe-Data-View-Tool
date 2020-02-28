import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateRowDialogComponent } from './update-row-dialog.component';

describe('UpdateRowDialogComponent', () => {
  let component: UpdateRowDialogComponent;
  let fixture: ComponentFixture<UpdateRowDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateRowDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateRowDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
