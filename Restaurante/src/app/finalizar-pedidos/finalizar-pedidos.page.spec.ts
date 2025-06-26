import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinalizarPedidosPage } from './finalizar-pedidos.page';

describe('FinalizarPedidosPage', () => {
  let component: FinalizarPedidosPage;
  let fixture: ComponentFixture<FinalizarPedidosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FinalizarPedidosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
