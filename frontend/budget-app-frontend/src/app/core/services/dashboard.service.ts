import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = environment.apiUrl;   //  only prefix

  constructor(private http: HttpClient) {}

  //  Financial Summary
  getFinancialOverview(): Observable<any> {
    return this.http.get(`${this.baseUrl}financial-overview/`);
  }

  //  Full Spending Analysis
  getSpendingAnalysis(): Observable<any> {
    return this.http.get(`${this.baseUrl}spending-analysis/`);
  }

  //  Monthly Spending Chart
  getMonthlySpending(): Observable<any> {
    return this.http.get(`${this.baseUrl}monthly-spending/`);
  }

  //  Category Spending Chart
  getCategorySpending(): Observable<any> {
    return this.http.get(`${this.baseUrl}category-spending/`);
  }
}
