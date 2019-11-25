import { TestBed } from '@angular/core/testing';

import { SadieProjectsService } from './sadie-projects.service';

describe('SadieProjectsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SadieProjectsService = TestBed.get(SadieProjectsService);
    expect(service).toBeTruthy();
  });
});
