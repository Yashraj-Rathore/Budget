import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { BudgetSummaryComponent } from './features/budget-summary/budget-summary.component';
import { CategoriesComponent } from './features/categories/categories.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: 'budget-summary', component: BudgetSummaryComponent },
  { path: 'categories', component: CategoriesComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }, // Default route to redirect to Dashboard
  {
    path: 'spending-analysis',
    loadChildren: () =>
      import('./features/spending-analysis/spending-analysis.module').then(
        (m) => m.SpendingAnalysisModule
      ),
  },
];
