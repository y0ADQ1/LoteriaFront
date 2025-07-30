import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarPartidas } from './listar-partidas';

describe('ListarPartidas', () => {
  let component: ListarPartidas;
  let fixture: ComponentFixture<ListarPartidas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarPartidas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarPartidas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
