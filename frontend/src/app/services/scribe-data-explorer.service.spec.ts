import { TestBed } from '@angular/core/testing';
import { ScribeDataExplorerService } from './scribe-data-explorer.service';


describe('ScribeDataExplorerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ScribeDataExplorerService = TestBed.get(ScribeDataExplorerService);
    expect(service).toBeTruthy();
  });
});
