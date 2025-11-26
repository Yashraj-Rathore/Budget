import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpendingAnalysisService {
  private apiUrl = 'http://localhost:8000/api/spending-analysis/';

  constructor(private http: HttpClient) {}

  getSpendingAnalysis(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}
