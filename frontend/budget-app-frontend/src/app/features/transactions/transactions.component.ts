import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TransactionService } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface TransactionFilters {
  fromDate: string | null;
  toDate: string | null;
  type: 'all' | 'income' | 'expense';
  categoryId: 'all' | number;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css'],
})
export class TransactionsComponent implements OnInit, OnDestroy {
  transactions: any[] = [];
  filteredTransactions: any[] = [];

  categories: any[] = [];

  /** Main edit form model (used by Edit button) */
  transaction: any = {
    id: null,
    amount: 0,
    type: 'income',
    category: '',
    date: '',
    description: '',
  };

  /** Quick-add form model (top row) */
  quickAmount: number | null = null;
  quickType: 'income' | 'expense' = 'income';
  quickCategoryId: number | null = null;
  quickDate: string = new Date().toISOString().slice(0, 10); // today
  quickDescription = '';

  /** Filter controls (bound in template) */
  filterFrom: string | null = null;
  filterTo: string | null = null;
  filterType: 'all' | 'income' | 'expense' = 'all';
  filterCategoryId: 'all' | number = 'all';

  /** Internal copy of filters used by applyFilters */
  private filters: TransactionFilters = {
    fromDate: null,
    toDate: null,
    type: 'all',
    categoryId: 'all',
  };

  /** Expanded row id for “details” drawer */
  expandedId: number | null = null;

  private transactionsSubscription?: Subscription;

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {}

  // --------------------------------------------------
  // Lifecycle
  // --------------------------------------------------
  ngOnInit(): void {
    this.loadTransactions();
    this.loadCategories();

    // auto-refresh when the service emits changes
    this.transactionsSubscription =
      this.transactionService.getTransactionsChanged().subscribe(() => {
        this.loadTransactions();
      });
  }

  ngOnDestroy(): void {
    this.transactionsSubscription?.unsubscribe();
  }

  // --------------------------------------------------
  // Load data
  // --------------------------------------------------
  loadTransactions(): void {
    this.transactionService.getTransactions().subscribe((data) => {
      this.transactions = data || [];
      this.applyFilters();
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(
      (data) => {
        this.categories = data || [];
      },
      (error) => {
        console.error('Error loading categories:', error);
      }
    );
  }

  // --------------------------------------------------
  // Quick Add
  // --------------------------------------------------
  onQuickAdd(): void {
    if (!this.quickAmount) {
      return;
    }

    const payload = {
      amount: this.quickAmount,
      type: this.quickType,
      category: this.quickCategoryId ?? null, // send null for “Uncategorised”
      date: this.quickDate,
      description: this.quickDescription,
    };

    this.transactionService.createTransaction(payload).subscribe(() => {
      this.clearQuickForm();
      // list will refresh via transactionsChanged subscription
    });
  }

  clearQuickForm(): void {
    this.quickAmount = null;
    this.quickType = 'income';
    this.quickCategoryId = null;
    this.quickDate = new Date().toISOString().slice(0, 10);
    this.quickDescription = '';
  }

  // --------------------------------------------------
  // Create / Update / Delete (main edit form)
  // --------------------------------------------------
  onSubmit(): void {
    const payload = {
      ...this.transaction,
      category:
        typeof this.transaction.category === 'object'
          ? this.transaction.category.id
          : this.transaction.category || null,
    };

    if (payload.id) {
      this.transactionService.updateTransaction(payload).subscribe(() => {
        this.resetForm();
      });
    } else {
      this.transactionService.createTransaction(payload).subscribe(() => {
        this.resetForm();
      });
    }
  }

  editTransaction(trans: any): void {
    this.transaction = {
      ...trans,
      category: trans.category?.id ?? trans.category ?? '',
    };
  }

  deleteTransaction(id: number): void {
    this.transactionService.deleteTransaction(id).subscribe(() => {
      // list will refresh via subscription
    });
  }

  resetForm(): void {
    this.transaction = {
      id: null,
      amount: 0,
      type: 'income',
      category: '',
      date: '',
      description: '',
    };
  }

  // --------------------------------------------------
  // Filters + derived list
  // --------------------------------------------------
  onFiltersChanged(): void {
    this.filters = {
      fromDate: this.filterFrom || null,
      toDate: this.filterTo || null,
      type: this.filterType,
      categoryId: this.filterCategoryId,
    };
    this.applyFilters();
  }

  // 🔴 CHANGED: made this public so template can call it
  applyFilters(): void {
    this.filteredTransactions = this.transactions.filter((t) => {
      // type
      if (this.filters.type !== 'all' && t.type !== this.filters.type) {
        return false;
      }

      // category (use id)
      if (
        this.filters.categoryId !== 'all' &&
        t.category?.id !== this.filters.categoryId
      ) {
        return false;
      }

      // date from
      if (this.filters.fromDate) {
        const from = new Date(this.filters.fromDate);
        const d = new Date(t.date);
        if (d < from) return false;
      }

      // date to
      if (this.filters.toDate) {
        const to = new Date(this.filters.toDate);
        const d = new Date(t.date);
        if (d > to) return false;
      }

      return true;
    });
  }

getCategoryLabel(t: any): string {
  // Case 1: backend returned full nested object
  if (t.category && typeof t.category === 'object' && 'name' in t.category) {
    return t.category.name;
  }

  // Case 2: backend returned just the ID
  if (t.category && this.categories?.length) {
    const match = this.categories.find((c) => c.id === t.category);
    if (match) {
      return match.name;
    }
  }

  return 'Uncategorised';
}



  // --------------------------------------------------
  // Row “details” toggle
  // --------------------------------------------------
  toggleDetails(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }
}
