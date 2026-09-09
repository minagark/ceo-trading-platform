import { Component, signal } from '@angular/core';
import { PortfolioPerformance } from '../portfolio-performance/portfolio-performance';
import type { Widget } from '../shared/models/widget';
import { HomepageWidget } from '../homepage-widget/homepage-widget';
import { PortfolioComposition } from '../portfolio-composition/portfolio-composition';
import { HoldingsList } from '../holdings/holdings-list';
import { ActivityList } from '../activity-list/activity-list';
import { Account, AccountsList } from '../accounts-list/accounts-list';


@Component({
  imports: [HomepageWidget, AccountsList], // imports to the templae
  selector: 'app-home-page',
  styleUrl: './home-page.css',
  templateUrl: './home-page.html',
})
export class HomePage {

  // give the data for the widget
  data = signal<Widget[]>([
    {
      id: "pp",
      label: "Portfolio Performance",
      content: PortfolioPerformance,
      selectedAccount: null,
    }, {
      id: "pc",
      label: "Portfolio Composition",
      content: PortfolioComposition,
      selectedAccount: null,
    }, {
      id: "ph",
      label: "Portfolio Holdings",
      content: HoldingsList,
      inputs: {
        showLess: true,
      },
      selectedAccount: null,
      route: "/holdings"
    }, {
      id: "aa",
      label: "Account Activity",
      content: ActivityList,
      inputs: {
        showLess: true,
      },
      selectedAccount: null,
      route: "/history"
    }])

    selectedAccount = signal<Account | null>(null);

    onAccountSelected(account: Account | null) {
      this.selectedAccount.set(account);

      // if we want the account to actually update each individual widget,
      // we need to add it to the `inputs` field, and then accept it in each
      // individual widget, and make THIS function update `inputs` rather than just selectedAccount
      this.data.update(widgets => 
        widgets.map(w => ({ 
          ...w, 
          selectedAccount: account 
        }))
      );
    }
}
