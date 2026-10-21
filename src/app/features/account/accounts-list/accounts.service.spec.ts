import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { UserApiService } from '../data-access/user-api.service';
import { PortfolioApiService } from '../../portfolio/data-access/portfolio-api.service';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;

  const userApi = {
    getPortfolios: vi.fn(),
  };

  const portfolioApi = {
    getTotalValue: vi.fn(),
  };

  beforeEach(() => {
    userApi.getPortfolios.mockReset();
    portfolioApi.getTotalValue.mockReset();

    TestBed.configureTestingModule({
      providers: [
        AccountsService,
        { provide: UserApiService, useValue: userApi },
        { provide: PortfolioApiService, useValue: portfolioApi },
      ],
    });

    service = TestBed.inject(AccountsService);
  });

  it('refreshAccountBalance updates only matching account', () => {
    service.accounts.set([
      { id: 'p1', name: 'Brokerage portfolio', type: 'BROKERAGE', balance: 100 },
      { id: 'p2', name: 'Retirement portfolio', type: 'RETIREMENT', balance: 200 },
    ]);

    portfolioApi.getTotalValue.mockReturnValue(of(150));

    service.refreshAccountBalance('p1');

    expect(service.accounts()[0].balance).toBe(150);
    expect(service.accounts()[1].balance).toBe(200);
  });
});
