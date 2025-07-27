import { TestBed } from '@angular/core/testing';

import { Juego } from './juego';

describe('Juego', () => {
  let service: Juego;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Juego);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
