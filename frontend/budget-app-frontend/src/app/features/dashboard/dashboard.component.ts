import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule], // 👈 gives you currency pipe, ngIf, ngFor, etc.
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  // === Top summary cards ===
  totalIncome = 0;
  totalExpenses = 0;
  currentBalance = 0;

  // === Charts ===
  monthlySpendingChart: any;
  categoryChart: any;
  incomeExpenseChart: any;

  // === Quick Insights (derived from charts) ===
  biggestMonthLabel: string | null = null;
  biggestMonthAmount = 0;

  topCategoryLabel: string | null = null;
  topCategoryAmount = 0;

  private subscriptions: Subscription[] = [];

  constructor(private dashboardService: DashboardService) {}

  // --------------------------------------------------
  // Lifecycle
  // --------------------------------------------------
  ngOnInit(): void {
    this.initCharts();
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // --------------------------------------------------
  // Data loading
  // --------------------------------------------------
  loadAllData(): void {
    this.loadFinancialOverview();
    this.loadMonthlySpending();
    this.loadCategorySpending();
  }

  private addSub(sub: Subscription) {
    this.subscriptions.push(sub);
  }

  // ---- Financial Overview (top 3 cards + doughnut) ----
  loadFinancialOverview(): void {
    const sub = this.dashboardService.getFinancialOverview().subscribe(
      (data) => {
        this.totalIncome = data.totalIncome ?? 0;
        this.totalExpenses = data.totalExpenses ?? 0;
        this.currentBalance = data.currentBalance ?? 0;

        if (this.incomeExpenseChart) {
          this.incomeExpenseChart.data.datasets[0].data = [
            this.totalIncome,
            this.totalExpenses,
          ];
          this.incomeExpenseChart.update();
        }
      },
      (err) => console.error('Financial overview error:', err)
    );

    this.addSub(sub);
  }

  // ---- Monthly spending line chart + biggest month insight ----
  loadMonthlySpending(): void {
    const sub = this.dashboardService.getMonthlySpending().subscribe(
      (monthly) => {
        const labels = (monthly || []).map((m: any) => m.month);
        const values = (monthly || []).map((m: any) => m.amount);

        if (this.monthlySpendingChart) {
          this.monthlySpendingChart.data.labels = labels;
          this.monthlySpendingChart.data.datasets[0].data = values;
          this.monthlySpendingChart.update();
        }

        // Quick insight: biggest spending month
        if (values.length > 0) {
          const max = Math.max(...values);
          const idx = values.indexOf(max);
          this.biggestMonthLabel = labels[idx];
          this.biggestMonthAmount = max;
        } else {
          this.biggestMonthLabel = null;
          this.biggestMonthAmount = 0;
        }
      },
      (err) => console.error('Monthly spending error:', err)
    );

    this.addSub(sub);
  }

  // ---- Category bar chart + top category insight ----
  loadCategorySpending(): void {
    const sub = this.dashboardService.getCategorySpending().subscribe(
      (categories) => {
        const labels = (categories || []).map((c: any) => c.category);
        const values = (categories || []).map((c: any) => c.amount);

        if (this.categoryChart) {
          this.categoryChart.data.labels = labels;
          this.categoryChart.data.datasets[0].data = values;
          this.categoryChart.update();
        }

        // Quick insight: most expensive category
        if (values.length > 0) {
          const max = Math.max(...values);
          const idx = values.indexOf(max);
          this.topCategoryLabel = labels[idx];
          this.topCategoryAmount = max;
        } else {
          this.topCategoryLabel = null;
          this.topCategoryAmount = 0;
        }
      },
      (err) => console.error('Category spending error:', err)
    );

    this.addSub(sub);
  }

  // --------------------------------------------------
  // Chart initialisation (empty – data filled by API)
  // --------------------------------------------------
  initCharts(): void {
    // Monthly spending line
    this.monthlySpendingChart = new Chart('monthlySpendingChart', {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Spending ($)',
            data: [],
            borderColor: '#42a5f5',
            backgroundColor: 'rgba(66,165,245,0.2)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        plugins: { legend: { labels: { color: '#ffffff' } } },
        scales: {
          x: { ticks: { color: '#bbbbbb' } },
          y: { ticks: { color: '#bbbbbb' } },
        },
      },
    });

    // Category bar
    this.categoryChart = new Chart('categoryChart', {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Amount ($)',
            data: [],
            backgroundColor: '#ef5350',
          },
        ],
      },
      options: {
        plugins: { legend: { labels: { color: '#ffffff' } } },
        scales: {
          x: { ticks: { color: '#bbbbbb' } },
          y: { ticks: { color: '#bbbbbb' } },
        },
      },
    });

    // Income vs expenses doughnut
    this.incomeExpenseChart = new Chart('incomeExpenseChart', {
      type: 'doughnut',
      data: {
        labels: ['Income', 'Expenses'],
        datasets: [
          {
            data: [0, 0],
            backgroundColor: ['#4caf50', '#ef5350'],
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            labels: { color: '#ffffff' },
          },
        },
      },
    });
  }
}
