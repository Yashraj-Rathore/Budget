import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpendingAnalysisComponent } from './spending-analysis.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [SpendingAnalysisComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: SpendingAnalysisComponent }]),
  ],
  exports: [SpendingAnalysisComponent],
})
export class SpendingAnalysisModule {}
