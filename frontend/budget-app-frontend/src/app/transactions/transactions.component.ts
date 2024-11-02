import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TransactionService } from '../services/transaction.service';
import { CategoryService } from '../services/category.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule], // Make sure FormsModule is included for ngModel
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  transactions: any[] = [];
  categories: any[] = [];
  transaction: any = { amount: 0, type: 'income', category: '', description: '' };
  private transactionsSubscription: Subscription | undefined; // Make it optional or assign it a default value

  constructor(private transactionService: TransactionService, private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadCategories();

    // Subscribe to changes in transactions
    this.transactionsSubscription = this.transactionService.getTransactionsChanged().subscribe(() => {
      this.loadTransactions();
    });
  }

  ngOnDestroy(): void {
    if (this.transactionsSubscription) {
      this.transactionsSubscription.unsubscribe();
    }
  }

  loadTransactions(): void {
    this.transactionService.getTransactions().subscribe((data) => {
      this.transactions = data;
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe((data) => {
      console.log('Loaded categories:', data);
      this.categories = data;
    }, (error) => {
      console.error('Error loading categories:', error);
    });
  }

  onSubmit(): void {
    if (this.transaction.id) {
      this.transactionService.updateTransaction(this.transaction).subscribe(() => {
        this.resetForm();
      });
    } else {
      this.transactionService.createTransaction(this.transaction).subscribe(() => {
        this.resetForm();
      });
    }
  }

  editTransaction(trans: any): void {
    this.transaction = { ...trans, category: trans.category };
  }

  deleteTransaction(id: number): void {
    this.transactionService.deleteTransaction(id).subscribe(() => {
      // No need to manually reload transactions; it's handled by the subscription.
    });
  }

  resetForm(): void {
    this.transaction = { amount: 0, type: 'income', category: '', description: '' };
  }
}
