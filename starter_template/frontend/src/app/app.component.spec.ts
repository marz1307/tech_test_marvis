
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import { AppService } from './app.service';

class MockAppService {
  getSummary() {
    return of({
      total_accounts: 10,
      active_accounts: 7,
      inactive_accounts: 3,
      total_records_sum: 281992,
      user_seats_sum: 58,
      read_only_seats_sum: 14,
    });
  }

  getIngestionReport() {
    return of({
      loaded_records: 10,
      invalid_rows: 0,
      invalid_samples: [],
    });
  }

  getRecords(limit: number) {
    return of({
      total: 10,
      items: [
        { 'Account Label': 'Atlas Systems', 'Subscription Status': 'active', 'User Seats': 6, 'Read Only Seats': 1, 'Total Records': 18450 },
        { 'Account Label': 'Northshore Digital', 'Subscription Status': 'inactive', 'User Seats': 0, 'Read Only Seats': 0, 'Total Records': 0 },
        { 'Account Label': 'Cloudline Ops', 'Subscription Status': 'active', 'User Seats': 12, 'Read Only Seats': 4, 'Total Records': 62310 },
        { 'Account Label': 'Pixel & Co', 'Subscription Status': 'active', 'User Seats': 3, 'Read Only Seats': 0, 'Total Records': 9875 },
        { 'Account Label': 'Ironclad Services', 'Subscription Status': 'inactive', 'User Seats': 0, 'Read Only Seats': 0, 'Total Records': 0 },
        { 'Account Label': 'Harbor Analytics', 'Subscription Status': 'active', 'User Seats': 9, 'Read Only Seats': 2, 'Total Records': 41002 },
        { 'Account Label': 'Vertex Platforms', 'Subscription Status': 'active', 'User Seats': 5, 'Read Only Seats': 1, 'Total Records': 23780 },
        { 'Account Label': 'Blue Oak Software', 'Subscription Status': 'active', 'User Seats': 15, 'Read Only Seats': 5, 'Total Records': 88940 },
        { 'Account Label': 'Signal Ridge', 'Subscription Status': 'inactive', 'User Seats': 1, 'Read Only Seats': 0, 'Total Records': 1120 },
        { 'Account Label': 'MotionStack', 'Subscription Status': 'active', 'User Seats': 7, 'Read Only Seats': 1, 'Total Records': 36515 },
      ],
    });
  }
}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  /**
   * Safely updates a component field that might be either:
   * - a plain property (string)
   * - OR an Angular signal (callable fn with .set)
   */
  const setMaybeSignal = (key: 'searchText' | 'statusFilter', value: any) => {
    const anyComp: any = component;
    const field = anyComp[key];

    // Signal case: function with .set
    if (typeof field === 'function' && typeof field.set === 'function') {
      field.set(value);
      return;
    }

    // Plain property case
    anyComp[key] = value;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent], // standalone component
      providers: [{ provide: AppService, useClass: MockAppService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;

    // Trigger ngOnInit
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should load 10 rows by default (no filters)', () => {
    expect(component.filteredItems().length).toBe(10);
  });

  it('should filter by status (active)', async () => {
    setMaybeSignal('statusFilter', 'active');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = component.filteredItems();
    expect(rows.length).toBe(7);
    expect(rows.every((r) => String(r['Subscription Status'] ?? '').toLowerCase() === 'active')).toBeTrue();
  });

  it('should filter by status (inactive)', async () => {
    setMaybeSignal('statusFilter', 'inactive');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = component.filteredItems();
    expect(rows.length).toBe(3);
    expect(rows.every((r) => String(r['Subscription Status'] ?? '').toLowerCase() === 'inactive')).toBeTrue();
  });

  it('should search account label case-insensitively', async () => {
    setMaybeSignal('searchText', 'atlas');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = component.filteredItems();
    expect(rows.length).toBe(1);
    expect(rows[0]['Account Label']).toBe('Atlas Systems');
  });

  it('should apply both filters together (search + status)', async () => {
    setMaybeSignal('searchText', 'ops');
    setMaybeSignal('statusFilter', 'active');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = component.filteredItems();
    expect(rows.length).toBe(1);
    expect(rows[0]['Account Label']).toBe('Cloudline Ops');
    expect(String(rows[0]['Subscription Status']).toLowerCase()).toBe('active');
  });

  it('top5() should return at most 5 items sorted by Total Records desc', () => {
    const top = component.top5();
    expect(top.length).toBeLessThanOrEqual(5);

    for (let i = 0; i < top.length - 1; i++) {
      const a = Number(top[i]['Total Records'] ?? 0);
      const b = Number(top[i + 1]['Total Records'] ?? 0);
      expect(a).toBeGreaterThanOrEqual(b);
    }
  });

  it('barWidthPct() should return a valid percent between 0 and 100', () => {
    const pct = component.barWidthPct(88940);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });
});