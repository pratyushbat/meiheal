import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentFailiureComponent } from './payment-failiure.component';

describe('PaymentFailiureComponent', () => {
  let component: PaymentFailiureComponent;
  let fixture: ComponentFixture<PaymentFailiureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentFailiureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PaymentFailiureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
