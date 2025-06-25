import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuMesaPage } from './menu-mesa.page';

describe('MenuMesaPage', () => {
  let component: MenuMesaPage;
  let fixture: ComponentFixture<MenuMesaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuMesaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
