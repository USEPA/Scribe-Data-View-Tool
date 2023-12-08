import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProjectsMapDialogComponent } from './projects-map-dialog.component';

describe('ProjectsMapDialogComponent', () => {
  let component: ProjectsMapDialogComponent;
  let fixture: ComponentFixture<ProjectsMapDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectsMapDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectsMapDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
