import {
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin } from 'rxjs';
import { TransactionService } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
import {
  Chart,
  ChartConfiguration,
  ChartDataset,
} from 'chart.js/auto';

interface CategoryBudgetRow {
  name: string;
  color?: string;
  budgetLimit: number | null;
  spent: number;
  remaining: number | null;
  percentUsed: number | null;
  status: 'over' | 'warning' | 'under' | 'no-budget';
}

@Component({
  selector: 'app-budget-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './budget-summary.component.html',
  styleUrls: ['./budget-summary.component.css'],
})
export class BudgetSummaryComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  // Raw data
  categories: any[] = [];
  transactions: any[] = [];

  // Per-category computed rows
  categoryBudgetRows: CategoryBudgetRow[] = [];

  // Top-level metrics
  totalPlannedBudget = 0;
  totalSpentThisMonth = 0;
  remainingBudget = 0;
  dailySpendTarget = 0;
  daysLeftInMonth = 0;
  hasAnyBudget = false;

  // Insights helpers
  overBudgetCategories: CategoryBudgetRow[] = [];
  warningCategories: CategoryBudgetRow[] = [];
  closestToLimit: CategoryBudgetRow | null = null;
  overBudgetNames = '';
  warningNames = '';

  // Charts
  private overallBudgetChart?: Chart;
  private categoryBudgetChart?: Chart;

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    // Load categories + transactions together, then compute everything
    const sub = forkJoin([
      this.categoryService.getCategories(),
      this.transactionService.getTransactions(),
    ]).subscribe(([categories, transactions]) => {
      this.categories = categories || [];
      this.transactions = transactions || [];
      this.recomputeBudgetSummary();
    });

    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    if (this.overallBudgetChart) {
      this.overallBudgetChart.destroy();
    }
    if (this.categoryBudgetChart) {
      this.categoryBudgetChart.destroy();
    }
  }

  /**
   * Main computation for:
   * - per-category rows
   * - top metrics
   * - insights
   * - charts
   */
  private recomputeBudgetSummary(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1) Filter this month's expenses
    const monthExpenses = (this.transactions || []).filter((t: any) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        t.type === 'expense'
      );
    });

    this.totalSpentThisMonth = monthExpenses.reduce(
      (sum: number, t: any) => sum + Number(t.amount || 0),
      0
    );

    // 2) Build category rows from categories + month expenses
    this.categoryBudgetRows = (this.categories || []).map((cat: any) => {
      const budgetLimitRaw =
        cat.budget_limit ?? cat.budgetLimit ?? null;
      const budgetLimit =
        budgetLimitRaw !== null && budgetLimitRaw !== undefined
          ? Number(budgetLimitRaw)
          : null;

      const spent = monthExpenses
        .filter(
          (t: any) =>
            t.category === cat.id ||
            t.category_id === cat.id ||
            t.category?.id === cat.id ||
            t.category_name === cat.name
        )
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

      const row: CategoryBudgetRow = {
        name: cat.name,
        color: cat.color,
        budgetLimit,
        spent,
        remaining: null,
        percentUsed: null,
        status: 'no-budget',
      };

      if (budgetLimit !== null && budgetLimit > 0) {
        row.remaining = budgetLimit - spent;
        const pct = (spent / budgetLimit) * 100;
        row.percentUsed = pct;

        if (pct > 110) {
          row.status = 'over';
        } else if (pct >= 80) {
          row.status = 'warning';
        } else {
          row.status = 'under';
        }
      }

      return row;
    });

    // 3) Aggregate metrics
    this.totalPlannedBudget = this.categoryBudgetRows
      .filter((r) => r.budgetLimit !== null && r.budgetLimit > 0)
      .reduce((sum, r) => sum + (r.budgetLimit || 0), 0);

    this.hasAnyBudget = this.totalPlannedBudget > 0;

    this.remainingBudget = this.totalPlannedBudget - this.totalSpentThisMonth;

    // 4) Daily spend target
    const daysInMonth = new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();
    this.daysLeftInMonth = Math.max(
      0,
      daysInMonth - now.getDate()
    );

    this.dailySpendTarget =
      this.remainingBudget > 0 && this.daysLeftInMonth > 0
        ? this.remainingBudget / this.daysLeftInMonth
        : 0;

    // 5) Insights sets
    this.overBudgetCategories = this.categoryBudgetRows.filter(
      (r) => r.status === 'over'
    );
    this.warningCategories = this.categoryBudgetRows.filter(
      (r) => r.status === 'warning'
    );

    this.overBudgetNames = this.overBudgetCategories
      .map((r) => r.name)
      .join(', ');
    this.warningNames = this.warningCategories
      .map((r) => r.name)
      .join(', ');

    this.closestToLimit =
      this.categoryBudgetRows
        .filter(
          (r) =>
            r.budgetLimit !== null &&
            r.budgetLimit > 0 &&
            r.percentUsed !== null
        )
        .sort(
          (a, b) => (b.percentUsed || 0) - (a.percentUsed || 0)
        )[0] || null;

    // 6) Charts
    this.updateCharts();
  }

  private updateCharts(): void {
    // Destroy old charts if they exist (avoid duplicates on recompute)
    if (this.overallBudgetChart) {
      this.overallBudgetChart.destroy();
      this.overallBudgetChart = undefined;
    }
    if (this.categoryBudgetChart) {
      this.categoryBudgetChart.destroy();
      this.categoryBudgetChart = undefined;
    }

    // Overall chart
    const overallCanvas = document.getElementById(
      'overallBudgetChart'
    ) as HTMLCanvasElement | null;

    if (overallCanvas) {
      const overallConfig: ChartConfiguration = {
        type: 'bar',
        data: {
          labels: ['Planned Budget', 'Actual Spend'],
          datasets: [
            {
              label: 'Amount',
              data: [
                this.totalPlannedBudget,
                this.totalSpentThisMonth,
              ],
            } as ChartDataset<'bar'>,
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      };

      this.overallBudgetChart = new Chart(
        overallCanvas,
        overallConfig
      );
    }

    // Per-category chart
    const categoryCanvas = document.getElementById(
      'categoryBudgetChart'
    ) as HTMLCanvasElement | null;

    if (categoryCanvas && this.categoryBudgetRows.length > 0) {
      const labels = this.categoryBudgetRows.map((r) => r.name);
      const plannedData = this.categoryBudgetRows.map((r) =>
        r.budgetLimit || 0
      );
      const spentData = this.categoryBudgetRows.map((r) => r.spent);

      const categoryConfig: ChartConfiguration = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Budget',
              data: plannedData,
            } as ChartDataset<'bar'>,
            {
              label: 'Spent',
              data: spentData,
            } as ChartDataset<'bar'>,
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      };

      this.categoryBudgetChart = new Chart(
        categoryCanvas,
        categoryConfig
      );
    }
  }
}
