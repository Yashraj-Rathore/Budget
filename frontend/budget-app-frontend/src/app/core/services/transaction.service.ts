import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = `${environment.apiUrl}transactions/`;
  private transactionsChanged = new Subject<void>();

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<any> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createTransaction(transaction: any): Observable<any> {
    return this.http.post(this.apiUrl, transaction).pipe(
      tap(() => {
        this.transactionsChanged.next();
      })
    );
  }

  updateTransaction(transaction: any): Observable<any> {
    return this.http.put(`${this.apiUrl}${transaction.id}/`, transaction).pipe(
      tap(() => {
        this.transactionsChanged.next();
      })
    );
  }

  deleteTransaction(transactionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${transactionId}/`).pipe(
      tap(() => {
        this.transactionsChanged.next();
      })
    );
  }

  getTransactionsChanged(): Observable<void> {
    return this.transactionsChanged.asObservable();
  }
}
