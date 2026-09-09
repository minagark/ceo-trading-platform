
/*
 * i am making a service so that account selection state can be shared so that account selection signal can be shared to dynamically rendered components 
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