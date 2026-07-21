import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpgradeUserComponent } from './upgrade-user.component';


describe('UpgradeUserComponent', () => {
  let component: UpgradeUserComponent;
  let fixture: ComponentFixture<UpgradeUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpgradeUserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpgradeUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
