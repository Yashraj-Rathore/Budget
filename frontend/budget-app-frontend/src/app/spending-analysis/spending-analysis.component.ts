import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { SpendingAnalysisService } from '../services/spending-analysis.service';

@Component({
  selector: 'app-spending-analysis',
  templateUrl: './spending-analysis.component.html',
  styleUrls: ['./spending-analysis.component.css']
})
export class SpendingAnalysisComponent implements OnInit, AfterViewInit {
  @ViewChild('spendingTrendChart', { static: false }) spendingTrendChart!: ElementRef<HTMLImageElement>;

  spendingAnalysis: any = {}; // Initialize with empty object
  recommendations: string = ''; // Initialize with empty string
  topCategories: any[] = []; // Initialize with empty array
  spendingTrendPlot: string = ''; // Initialize with empty string

  constructor(private spendingAnalysisService: SpendingAnalysisService) {}

  ngOnInit(): void {
    this.fetchSpendingAnalysis();
  }

  ngAfterViewInit(): void {
    // Ensure chart rendering happens after the view is initialized
    this.renderSpendingTrendChart();
  }

  fetchSpendingAnalysis(): void {
    this.spendingAnalysisService.getSpendingAnalysis().subscribe(
      (data) => {
        this.spendingAnalysis = data.analysis;
        this.recommendations = data.recommendations.recommendations;
        this.topCategories = data.top_spending_categories;
        this.spendingTrendPlot = data.spending_trend_plot;

        // Render charts if necessary
        this.renderSpendingTrendChart();
      },
      (error) => {
        console.error('Error fetching spending analysis:', error);
      }
    );
  }

  renderSpendingTrendChart(): void {
    if (this.spendingTrendPlot && this.spendingTrendChart) {
      this.spendingTrendChart.nativeElement.src = `data:image/png;base64,${this.spendingTrendPlot}`;
    }
  }
}
