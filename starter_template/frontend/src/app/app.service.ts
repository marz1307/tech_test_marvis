import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RootMessage {
  message: string;
}

export interface IngestionReport {
  loaded_records: number;
  invalid_rows: number;
  invalid_samples: any[];
}

export interface RecordsResponse {
  total: number;
  items: any[];
}

export interface SummaryResponse {
  total_accounts: number;
  active_accounts: number;
  inactive_accounts: number;
  total_records_sum: number;
  user_seats_sum: number;
  read_only_seats_sum: number;
}

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private readonly baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  getRootMessage(): Observable<RootMessage> {
    return this.http.get<RootMessage>(`${this.baseUrl}/`);
  }

  getIngestionReport(): Observable<IngestionReport> {
    return this.http.get<IngestionReport>(`${this.baseUrl}/ingestion-report`);
  }

  getRecords(limit = 100): Observable<RecordsResponse> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<RecordsResponse>(`${this.baseUrl}/records`, { params });
  }
  getSummary(): Observable<SummaryResponse> {
    return this.http.get<SummaryResponse>(`${this.baseUrl}/summary`);
  }
}