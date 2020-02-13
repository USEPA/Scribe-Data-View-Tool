import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VisibleColumnsDialogComponent } from './visible-columns-dialog.component';

describe('VisibleColumnsDialogComponent', () => {
  let component: VisibleColumnsDialogComponent;
  let fixture: ComponentFixture<VisibleColumnsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VisibleColumnsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisibleColumnsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
