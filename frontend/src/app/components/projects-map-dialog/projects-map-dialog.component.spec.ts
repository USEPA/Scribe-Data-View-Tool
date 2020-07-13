import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsMapDialogComponent } from './projects-map-dialog.component';

describe('ProjectsMapDialogComponent', () => {
  let component: ProjectsMapDialogComponent;
  let fixture: ComponentFixture<ProjectsMapDialogComponent>;

  beforeEach(async(() => {
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
