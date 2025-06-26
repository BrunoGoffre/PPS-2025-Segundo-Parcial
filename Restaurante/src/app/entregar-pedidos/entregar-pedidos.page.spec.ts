import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntregarPedidosPage } from './entregar-pedidos.page';

describe('EntregarPedidosPage', () => {
  let component: EntregarPedidosPage;
  let fixture: ComponentFixture<EntregarPedidosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EntregarPedidosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
