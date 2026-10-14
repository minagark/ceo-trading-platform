import { Injectable, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Account } from './accounts-list';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  
  //accounts = httpResource<Account[]>(() => '/api/accounts');

  // Mock data — swap for httpResource<Account[]>(() => '/api/accounts')
  // once the accounts API exists (same pattern as AssetsService).
  accounts = signal<Account[]>([
    { id: '1', name: 'Brokerage', type: 'Individual', balance: 24310.55 },
    { id: '2', name: 'Retirement', type: 'IRA', balance: 118432.02 },
    { id: '3', name: 'Active Trading', type: 'Margin', balance: 5602.13 },
  ]);
}

/* TODO: cache account information for quick swithcing ??*/