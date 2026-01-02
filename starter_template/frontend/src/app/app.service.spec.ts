import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppService],
    });

    service = TestBed.inject(AppService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getSummary() should GET /summary', () => {
    const mock = {
      total_accounts: 10,
      active_accounts: 7,
      inactive_accounts: 3,
      total_records_sum: 281992,
      user_seats_sum: 58,
      read_only_seats_sum: 14,
    };

    service.getSummary().subscribe((res) => {
      expect(res).toEqual(mock);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/summary'));
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getIngestionReport() should GET /ingestion-report', () => {
    const mock = {
      loaded_records: 10,
      invalid_rows: 0,
      invalid_samples: [],
    };

    service.getIngestionReport().subscribe((res) => {
      expect(res).toEqual(mock);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/ingestion-report'));
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getRecords(limit) should GET /records with limit param', () => {
    const mock = {
      total: 10,
      items: [],
    };

    service.getRecords(100).subscribe((res) => {
      expect(res).toEqual(mock);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/records'));
    expect(req.request.method).toBe('GET');

    // Works whether you used HttpParams OR a query string
    expect(req.request.urlWithParams).toContain('limit=100');

    req.flush(mock);
  });
});