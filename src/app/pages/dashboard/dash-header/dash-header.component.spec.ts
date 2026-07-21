import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DHeaderComponent } from './dash-header.component';



describe('DHeaderComponent', () => {
  let component: DHeaderComponent;
  let fixture: ComponentFixture<DHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
