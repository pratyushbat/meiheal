import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreFrontProductDetailComponent } from './storefront-product-detail.component';

describe('StoreFrontProductDetailComponent', () => {
  let component: StoreFrontProductDetailComponent;
  let fixture: ComponentFixture<StoreFrontProductDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StoreFrontProductDetailComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(StoreFrontProductDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
