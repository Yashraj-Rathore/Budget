import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../services/dashboard.service';
import { TransactionService } from '../services/transaction.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  totalIncome: number = 0;
  totalExpenses: number = 0;
  currentBalance: number = 0;
  transactionsSubscription: Subscription | null = null; // Initialize or use optional chaining

  constructor(
    private dashboardService: DashboardService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.loadFinancialOverview();

    // Subscribe to changes in transactions
    this.transactionsSubscription = this.transactionService.getTransactionsChanged().subscribe(() => {
      this.loadFinancialOverview();
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leaks
    if (this.transactionsSubscription) {
      this.transactionsSubscription.unsubscribe();
    }
  }

  loadFinancialOverview(): void {
    this.dashboardService.getFinancialOverview().subscribe(
      (data) => {
        this.totalIncome = data.totalIncome;
        this.totalExpenses = data.totalExpenses;
        this.currentBalance = data.currentBalance;
      },
      (error) => {
        console.error('Error fetching financial overview data', error);
      }
    );
  }
}
