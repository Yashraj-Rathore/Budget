import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}financial-overview/`;

  constructor(private http: HttpClient) {}

  getFinancialOverview(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}
