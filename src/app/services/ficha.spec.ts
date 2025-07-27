import { TestBed } from '@angular/core/testing';

import { Ficha } from './ficha';

describe('Ficha', () => {
  let service: Ficha;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ficha);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
