import { Component, OnInit, AfterViewInit } from '@angular/core';
import { SpendingAnalysisService } from '../../core/services/spending-analysis.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-spending-analysis',
  templateUrl: './spending-analysis.component.html',
  styleUrls: ['./spending-analysis.component.css'],
})
export class SpendingAnalysisComponent implements OnInit, AfterViewInit {
  /* ---------- RAW API DATA ---------- */
  analysis: any = {};
  forecast: any = {};
  recurringExpenses: any[] = [];

  monthlySpending: any[] = [];
  categorySpending: any[] = [];

  /* ---------- DERIVED METRICS ---------- */
  totalTrackedSpending = 0;
  averageMonthlySpend = 0;
  thisMonthSpend = 0;
  nextMonthForecast = 0;

  topCategories: any[] = [];
  topCategoryName = '';
  topCategoryAmount = 0;

  insights: string[] = [];
  recommendations: string[] = [];

  /* ---------- FILTERS ---------- */
  selectedMonth = 'All';
  months: string[] = [
    'All',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  /* ---------- CHART HANDLES ---------- */
  private trendChart?: Chart;
  private categoryChart?: Chart;

  // coordination between data + view init
  private viewInitialized = false;
  private analysisLoaded = false;

  constructor(private spendingService: SpendingAnalysisService) {}

  /* =========================
   *  LIFECYCLE
   * ========================= */

  ngOnInit(): void {
    this.fetchAnalysis();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    // if data already arrived, render charts now
    if (this.analysisLoaded) {
      this.renderOrUpdateTrendChart();
      this.renderOrUpdateCategoryChart();
    }
  }

  /* =========================
   *  DATA FETCH + METRICS
   * ========================= */

  fetchAnalysis(): void {
    this.spendingService.getSpendingAnalysis().subscribe({
      next: (response: any) => {
        this.analysis = response?.analysis || {};
        this.forecast = response?.forecast || {};
        this.recurringExpenses = response?.recurring || [];

        // unpack analysis
        const summary = this.analysis.summary || {};
        this.categorySpending = this.analysis.category_spending || [];
        this.monthlySpending = this.analysis.monthly_spending || [];

        // core metrics
        this.totalTrackedSpending = Number(summary.total_expenses || 0);

        const monthsCount = this.monthlySpending.length || 1;
        this.averageMonthlySpend =
          monthsCount > 0 ? this.totalTrackedSpending / monthsCount : 0;

        // current month spend (YYYY-MM)
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, '0')}`;

        const currentMonthEntry = this.monthlySpending.find(
          (m: any) => m.month === currentKey
        );
        this.thisMonthSpend = currentMonthEntry
          ? Number(currentMonthEntry.amount || 0)
          : 0;

        // forecast
        this.nextMonthForecast = Number(
          this.forecast?.predicted_expense || 0
        );

        // top categories (take top 5)
        this.topCategories = this.categorySpending
          .slice()
          .sort((a: any, b: any) => b.amount - a.amount)
          .slice(0, 5);

        if (this.topCategories.length) {
          this.topCategoryName = this.topCategories[0].category;
          this.topCategoryAmount = Number(this.topCategories[0].amount || 0);
        } else {
          this.topCategoryName = '';
          this.topCategoryAmount = 0;
        }

        // build textual insights / suggestions
        this.buildInsightsAndRecommendations();

        this.analysisLoaded = true;

        // if view is ready, draw / update charts
        if (this.viewInitialized) {
          this.renderOrUpdateTrendChart();
          this.renderOrUpdateCategoryChart();
        }
      },
      error: (err) => {
        console.error('Error fetching spending analysis:', err);
      },
    });
  }

  /* Called when the month filter dropdown changes */
  onMonthChange(): void {
    if (this.trendChart) {
      this.renderOrUpdateTrendChart();
    }
  }

  /* =========================
   *  INSIGHTS / RECOMMENDATIONS
   * ========================= */

  private buildInsightsAndRecommendations(): void {
    const insights: string[] = [];

    if (this.averageMonthlySpend > 0) {
      insights.push(
        `On average you spend ${this.averageMonthlySpend.toLocaleString(
          'en-US',
          { style: 'currency', currency: 'USD' }
        )} per month.`
      );
    }

    if (this.thisMonthSpend > 0) {
      insights.push(
        `You've already spent ${this.thisMonthSpend.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })} this month.`
      );
    }

    if (this.topCategoryName) {
      insights.push(
        `Your highest spending category overall is ${this.topCategoryName} (${this.topCategoryAmount.toLocaleString(
          'en-US',
          { style: 'currency', currency: 'USD' }
        )}).`
      );
    }

    this.insights = insights;

    const recs: string[] = [];
    if (this.topCategoryName) {
      recs.push(
        `Consider setting a tighter budget for ${this.topCategoryName} if you want to reduce your overall spending.`
      );
    }
    if (this.recurringExpenses.length) {
      recs.push(
        'Review your recurring expenses to see if any subscriptions can be cancelled or downgraded.'
      );
    }
    if (!recs.length) {
      recs.push(
        'Start adding more transactions to unlock personalised tips about your spending patterns.'
      );
    }

    this.recommendations = recs;
  }

  /* =========================
   *  CHART HELPERS
   * ========================= */

  private getFilteredMonthlySpending(): any[] {
    if (this.selectedMonth === 'All') {
      return this.monthlySpending || [];
    }

    const idx = this.months.indexOf(this.selectedMonth);
    if (idx <= 0) return this.monthlySpending || [];

    const monthStr = String(idx).padStart(2, '0'); // e.g. "03"
    return (this.monthlySpending || []).filter(
      (m: any) => (m.month || '').slice(5, 7) === monthStr
    );
  }

  private renderOrUpdateTrendChart(): void {
    const dataset = this.getFilteredMonthlySpending();
    const labels = dataset.map((m: any) => m.month);
    const values = dataset.map((m: any) => m.amount);

    if (this.trendChart) {
      this.trendChart.data.labels = labels;
      this.trendChart.data.datasets[0].data = values;
      this.trendChart.update();
      return;
    }

    const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Monthly Spending',
            data: values,
            borderColor: '#4FC3F7',
            backgroundColor: 'rgba(79, 195, 247, 0.25)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: '#e5e7eb',
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#111827' },
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#9ca3af' },
            grid: { color: '#111827' },
          },
        },
      },
    });
  }

  private renderOrUpdateCategoryChart(): void {
    const labels = this.topCategories.map((c: any) => c.category);
    const values = this.topCategories.map((c: any) => c.amount);

    if (!labels.length) {
      // nothing to render yet
      if (this.categoryChart) {
        this.categoryChart.destroy();
        this.categoryChart = undefined;
      }
      return;
    }

    if (this.categoryChart) {
      this.categoryChart.data.labels = labels;
      this.categoryChart.data.datasets[0].data = values;
      this.categoryChart.update();
      return;
    }

    const canvas = document.getElementById(
      'categoryBreakdownChart'
    ) as HTMLCanvasElement;
    if (!canvas) return;

    this.categoryChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              '#4f46e5',
              '#22c55e',
              '#eab308',
              '#ec4899',
              '#06b6d4',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#e5e7eb' },
          },
        },
      },
    });
  }

  /* =========================
   *  TEMPLATE ALIASES
   * =========================
   * These getters keep the existing HTML working by
   * mapping old variable names to the new ones.
   */

  get totalExpensesOverall(): number {
    return this.totalTrackedSpending;
  }

  get avgMonthlySpend(): number {
    return this.averageMonthlySpend;
  }

  get currentMonthSpend(): number {
    return this.thisMonthSpend;
  }

  get predictedNextMonthSpend(): number {
    return this.nextMonthForecast;
  }

  get recommendationsList(): string[] {
    return this.recommendations;
  }
}
