import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmarPedidosPage } from './confirmar-pedidos.page';

describe('ConfirmarPedidosPage', () => {
  let component: ConfirmarPedidosPage;
  let fixture: ComponentFixture<ConfirmarPedidosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmarPedidosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
