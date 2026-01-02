// src/app/app.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppService } from './app.service';

/** Backend payload types (keep aligned with your FastAPI responses) */
export interface IngestionReport {
  loaded_records: number;
  invalid_rows: number;
  invalid_samples?: unknown[];
}

export interface SummaryResponse {
  total_accounts: number;
  active_accounts: number;
  inactive_accounts: number;
  total_records_sum: number;
  user_seats_sum: number;
  read_only_seats_sum: number;
}

/** Each row in the “records” table (CSV-derived). Keys match your backend output. */
export type RecordRow = Record<string, any>;

export interface RecordsResponse {
  total: number;
  items: RecordRow[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  // Your HTML template lives here (you already have it set up).
  template: `
    <main class="page">
      <h1 align="center">Customer Insights Dashboard</h1>

      <!-- SUMMARY -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Summary</h2>
        </div>

        <ng-container *ngIf="summary(); else loadingSummary">
          <div class="summary-grid">
            <div class="metric-card">
              <div class="metric-label">Total Accounts</div>
              <div class="metric-value">{{ fmtInt(summary()?.total_accounts) }}</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Total Records</div>
              <div class="metric-value">{{ fmtInt(summary()?.total_records_sum) }}</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Active Accounts</div>
              <div class="metric-value">{{ fmtInt(summary()?.active_accounts) }}</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Inactive Accounts</div>
              <div class="metric-value">{{ fmtInt(summary()?.inactive_accounts) }}</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">User Seats</div>
              <div class="metric-value">{{ fmtInt(summary()?.user_seats_sum) }}</div>
            </div>

            <div class="metric-card">
              <div class="metric-label">Read Only Seats</div>
              <div class="metric-value">{{ fmtInt(summary()?.read_only_seats_sum) }}</div>
            </div>
          </div>
        </ng-container>

        <ng-template #loadingSummary>
          <div>Loading summary...</div>
        </ng-template>
      </section>

      <!-- INGESTION REPORT -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Ingestion Report</h2>
        </div>

        <ng-container *ngIf="loading(); else loadedContent">
          <p>Loading...</p>
        </ng-container>

        <ng-template #loadedContent>
          <p *ngIf="error()" style="color:#b00020;">{{ error() }}</p>

          <div *ngIf="ingestionReport()">
            <div>Loaded records: {{ fmtInt(ingestionReport()!.loaded_records) }}</div>
            <div>Invalid rows: {{ fmtInt(ingestionReport()!.invalid_rows) }}</div>
            <div>Invalid samples: {{ fmtInt(ingestionReport()!.invalid_samples?.length ?? 0) }}</div>
          </div>
        </ng-template>
      </section>

      <!-- RECORDS -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Records</h2>
        </div>

        <!-- Filters -->
        <div style="display:flex; gap:12px; align-items:center; margin-bottom:10px;">
          <label>
            Search (Account Label):
            <input
              [(ngModel)]="searchText"
              placeholder="e.g. Atlas"
              style="margin-left:6px; padding:4px 6px; width:220px;"
            />
          </label>

          <label>
            Status:
            <select [(ngModel)]="statusFilter" style="margin-left:6px; padding:4px 6px;">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <!-- Top 5 chart -->
        <div style="border:1px solid #ddd; padding:10px; margin-bottom:12px;">
          <div style="font-weight:600; margin-bottom:8px;">Top 5 Accounts by Total Records</div>

          <div *ngIf="top5().length === 0" style="color:#666;">No data available.</div>

          <div *ngFor="let r of top5()" style="margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; font-size:12px;">
              <span>{{ r['Account Label'] }}</span>
              <span>{{ fmtInt(r['Total Records']) }}</span>
            </div>

            <div style="height:10px; border:1px solid #ccc;">
              <div
                style="height:100%; background-color:#2196f3;"
                [style.width.%]="barWidthPct(r['Total Records'])"
              ></div>
            </div>
          </div>

          <div style="font-size:12px; color:#666; margin-top:8px;">
            Interpretation: accounts with higher “Total Records” may require additional support or billing review.
          </div>
        </div>

        <!-- Table (filters drive this table) -->
        <table
          border="1"
          cellpadding="6"
          cellspacing="0"
          style="border-collapse:collapse; width:100%;"
        >
          <thead>
            <tr>
              <th>Account Label</th>
              <th>Status</th>
              <th>User Seats</th>
              <th>Read Only Seats</th>
              <th>Total Records</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let r of filteredItems()">
              <td>{{ r['Account Label'] }}</td>
              <td>{{ r['Subscription Status'] }}</td>
              <td>{{ fmtInt(r['User Seats']) }}</td>
              <td>{{ fmtInt(r['Read Only Seats']) }}</td>
              <td>{{ fmtInt(r['Total Records']) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  `,
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  // ---------------------------------------------------------------------------
  // Reactive state (Angular Signals)
  // ---------------------------------------------------------------------------

  /** True while any initial API load is in progress */
  loading = signal<boolean>(true);

  /** UI-safe error message (shown in the Ingestion Report section) */
  error = signal<string>('');

  /** Ingestion report returned by the backend */
  ingestionReport = signal<IngestionReport | null>(null);

  /** Records payload returned by the backend */
  records = signal<RecordsResponse | null>(null);

  /** Summary payload returned by the backend */
  summary = signal<SummaryResponse | null>(null);

  // ---------------------------------------------------------------------------
  // UI-controlled filter values (bound via ngModel)
  // ---------------------------------------------------------------------------

  /** Free-text search for “Account Label” (case-insensitive) */
  searchText = '';

  /**
   * Status filter:
   * - ''        => no filtering (All)
   * - 'active'  => only active
   * - 'inactive'=> only inactive
   */
  statusFilter: '' | 'active' | 'inactive' = '';

  // ---------------------------------------------------------------------------
  // Number formatting (presentation layer)
  // ---------------------------------------------------------------------------

  /**
   * Locale-aware number formatter.
   * en-GB gives 281992 -> 281,992
   */
  private readonly nf = new Intl.NumberFormat('en-GB');

  /**
   * Safely coerce any value (number/string/null) into a finite number.
   * This prevents UI bugs when the backend sends numeric fields as strings.
   */
  toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
      // Remove thousands separators if present, then parse
      const cleaned = value.replace(/,/g, '').trim();
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : 0;
    }

    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Format a value as an integer with thousands separators.
   * Use in the template for metrics and table numeric cells.
   */
  fmtInt(value: unknown): string {
    return this.nf.format(this.toNumber(value));
  }

  // ---------------------------------------------------------------------------
  // Derived data (computed signals)
  // ---------------------------------------------------------------------------

  /**
   * Filtered rows used by the table (and linked to the filters).
   * - Account label search is case-insensitive
   * - Status filter is case-insensitive and matches “Subscription Status”
   */
  filteredItems = computed<RecordRow[]>(() => {
    const items = this.records()?.items ?? [];

    const q = (this.searchText || '').trim().toLowerCase();
    const status = (this.statusFilter || '').trim().toLowerCase();

    return items.filter((r) => {
      const accountLabel = String(r['Account Label'] ?? '').toLowerCase();
      const rowStatus = String(r['Subscription Status'] ?? '').toLowerCase();

      const matchesLabel = !q || accountLabel.includes(q);
      const matchesStatus = !status || rowStatus === status;

      return matchesLabel && matchesStatus;
    });
  });

  /**
   * Top 5 rows by Total Records (for the horizontal bars).
   * This is independent of the table size — it always shows 5 max.
   */
  top5 = computed<RecordRow[]>(() => {
    const items = this.records()?.items ?? [];

    // Sort by Total Records descending and take top 5
    return [...items]
      .sort((a, b) => this.toNumber(b['Total Records']) - this.toNumber(a['Total Records']))
      .slice(0, 5);
  });

  // ---------------------------------------------------------------------------
  // Dependency injection
  // ---------------------------------------------------------------------------

  constructor(private api: AppService) {}

  // ---------------------------------------------------------------------------
  // Lifecycle: initial page load calls
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    // Load ingestion report
    this.api.getIngestionReport().subscribe({
      next: (data) => this.ingestionReport.set(data),
      error: () => this.error.set('Failed to load ingestion report.'),
    });

    // Load records (request up to 100 so we include the 10 records you need)
    this.api.getRecords(100).subscribe({
      next: (data) => {
        this.records.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load records.');
        this.loading.set(false);
      },
    });

    // Load summary
    this.api.getSummary().subscribe({
      next: (data) => this.summary.set(data),
      error: () => this.error.set('Failed to load summary.'),
    });
  }

  // ---------------------------------------------------------------------------
  // Chart utilities
  // ---------------------------------------------------------------------------

  /**
   * Convert a “Total Records” value into a bar width percentage (0..100),
   * relative to the maximum value in the top5() set.
   *
   * Note: Uses toNumber() to handle string/number inputs safely.
   */
  barWidthPct(totalRecords: unknown): number {
    const value = this.toNumber(totalRecords);
    const max = Math.max(...this.top5().map((r) => this.toNumber(r['Total Records'])), 0);

    if (max <= 0) return 0;
    return Math.round((value / max) * 100);
  }
}