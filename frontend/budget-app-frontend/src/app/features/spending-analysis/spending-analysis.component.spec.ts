//spending-analysis.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpendingAnalysisComponent } from './spending-analysis.component';

describe('SpendingAnalysisComponent', () => {
  let component: SpendingAnalysisComponent;
  let fixture: ComponentFixture<SpendingAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpendingAnalysisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpendingAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
