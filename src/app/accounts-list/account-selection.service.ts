
/*
 * this is a service so that account selection state can be shared across all components
 * so that account selection signal can be shared to dynamically rendered components,
 * solely for business logicx and functionality, not template rendering
 * 
 * use this service as a single source of truth to get to the currently selected account
 * rather than having each component manage its own selection state and having repeated code
 */
import { Injectable, signal } from '@angular/core';
import { Account } from './accounts-list';

@Injectable({ providedIn: 'root' })
export class AccountSelectionService {
    // the logic of getting the selected account and seeing its changes
    selectedAccount = signal<Account | null>(null);

    onAccountSelected(account: Account | null) {
      this.selectedAccount.set(account);
    }
}