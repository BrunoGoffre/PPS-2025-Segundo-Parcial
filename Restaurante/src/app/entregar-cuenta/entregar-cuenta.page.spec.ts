import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntregarCuentaPage } from './entregar-cuenta.page';

describe('EntregarCuentaPage', () => {
  let component: EntregarCuentaPage;
  let fixture: ComponentFixture<EntregarCuentaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EntregarCuentaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
