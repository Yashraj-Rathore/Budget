import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpendingAnalysisComponent } from './spending-analysis.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [SpendingAnalysisComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: SpendingAnalysisComponent }
    ])
  ],
  exports: [SpendingAnalysisComponent],
})
export class SpendingAnalysisModule { }
