import { TestBed } from '@angular/core/testing';

import { MazoCarta } from './mazo-carta';

describe('MazoCarta', () => {
  let service: MazoCarta;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MazoCarta);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
