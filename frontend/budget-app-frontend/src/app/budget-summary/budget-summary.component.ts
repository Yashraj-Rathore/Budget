import { Component, OnInit, AfterViewInit, OnDestroy, Inject, Renderer2, ElementRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, ChartItem, registerables } from 'chart.js';  // Import and register all necessary elements
import { TransactionService } from '../services/transaction.service';

// Register all elements, controllers, scales, and plugins required for Chart.js
Chart.register(...registerables);

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description?: string;
  category_name: string;  // Add this property
  category: number;       // Category ID that refers to the category entity
  user?: number | null;
}


@Component({
  selector: 'app-budget-summary',
  templateUrl: './budget-summary.component.html',
  styleUrls: ['./budget-summary.component.css']
})
export class BudgetSummaryComponent implements OnInit, AfterViewInit, OnDestroy {
  transactions: Transaction[] = [];
  private incomeExpenseChart: Chart<'bar', number[], string> | null = null;
  private categoryWiseChart: Chart<'pie', number[], string> | null = null;
  private isBrowser: boolean;

  constructor(
    private transactionService: TransactionService,
    private renderer: Renderer2,
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadTransactions();
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => this.renderCharts(), 500); // Delay to ensure elements are loaded
    }
  }

  ngOnDestroy(): void {
    // Destroy existing charts to free up canvas elements when the component is destroyed
    if (this.incomeExpenseChart) {
      this.incomeExpenseChart.destroy();
    }
    if (this.categoryWiseChart) {
      this.categoryWiseChart.destroy();
    }
  }

  loadTransactions(): void {
    this.transactionService.getTransactions().subscribe((transactions: Transaction[]) => {
      console.log('Loaded transactions:', transactions);
      this.transactions = transactions;
      if (this.isBrowser) {
        this.renderCharts(); // Render charts after transactions are loaded
      }
    });
}


 renderCharts(): void {
  if (this.transactions.length > 0) {
    const incomeTransactions = this.transactions.filter((t: Transaction) => t.type === 'income');
    const expenseTransactions = this.transactions.filter((t: Transaction) => t.type === 'expense');

    // Convert amount to number to ensure correct summation
    const totalIncome = incomeTransactions.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
    const totalExpenses = expenseTransactions.reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);

    // Logging to verify correct values
    console.log('Total Income:', totalIncome);
    console.log('Total Expenses:', totalExpenses);

    this.renderIncomeExpenseChart(totalIncome, totalExpenses);
    this.renderCategoryWiseChart(expenseTransactions);
  }
}


  renderIncomeExpenseChart(totalIncome: number, totalExpenses: number): void {
  const chartElement = this.el.nativeElement.querySelector('#incomeExpenseChart') as HTMLCanvasElement;

  if (chartElement) {
    const ctx = chartElement.getContext('2d');
    if (ctx) {
      if (this.incomeExpenseChart) {
        this.incomeExpenseChart.destroy(); // Destroy existing chart before creating a new one
      }

      // Check if totalExpenses is being passed correctly
      console.log('Total Income:', totalIncome);
      console.log('Total Expenses:', totalExpenses);

      const config: ChartConfiguration<'bar', number[], string> = {
        type: 'bar',
        data: {
          labels: ['Income', 'Expenses'],
          datasets: [
            {
              label: 'Amount in $',
              data: [totalIncome, totalExpenses], // Should have both values
              backgroundColor: ['#28a745', '#dc3545'], // Green for income, Red for expenses
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
          },
        },
      };

      this.incomeExpenseChart = new Chart(ctx, config);
    } else {
      console.error('Failed to acquire context for Income vs Expense chart');
    }
  } else {
    console.error('IncomeExpenseChart canvas element not found.');
  }
}



renderCategoryWiseChart(expenseTransactions: Transaction[]): void {
    const chartElement = this.el.nativeElement.querySelector('#categoryWiseChart') as HTMLCanvasElement;

    if (chartElement) {
        const ctx = chartElement.getContext('2d');
        if (ctx) {
            if (this.categoryWiseChart) {
                this.categoryWiseChart.destroy(); // Destroy existing chart before creating a new one
            }

            const categoryTotals = expenseTransactions.reduce((totals: { [key: string]: number }, transaction: Transaction) => {
                const category = transaction.category_name;  // Using category_name
                if (!totals[category]) {
                    totals[category] = 0;
                }
                totals[category] += transaction.amount;
                return totals;
            }, {});

            const categoryLabels = Object.keys(categoryTotals);
            const categoryValues = Object.values(categoryTotals);

            console.log("Category Labels:", categoryLabels); // Debug to verify data
            console.log("Category Values:", categoryValues); // Debug to verify data

            const config: ChartConfiguration<'pie', number[], string> = {
                type: 'pie',
                data: {
                    labels: categoryLabels,
                    datasets: [
                        {
                            label: 'Category Wise Expenses',
                            data: categoryValues,
                            backgroundColor: ['#f39c12', '#8e44ad', '#e74c3c', '#3498db', '#2ecc71'],
                        },
                    ],
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                    },
                },
            };

            this.categoryWiseChart = new Chart(ctx, config);
        } else {
            console.error('Failed to acquire context for Category Wise Expenses chart');
        }
    } else {
        console.error('CategoryWiseChart canvas element not found.');
    }
}


}
