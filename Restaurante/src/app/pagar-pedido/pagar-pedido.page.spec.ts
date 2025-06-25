import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagarPedidoPage } from './pagar-pedido.page';

describe('PagarPedidoPage', () => {
  let component: PagarPedidoPage;
  let fixture: ComponentFixture<PagarPedidoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PagarPedidoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
