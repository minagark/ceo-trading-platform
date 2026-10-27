import { Component, effect, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PortfolioPerformance } from '../../portfolio/portfolio-performance/portfolio-performance';
import type { Widget } from '../../../shared/models/widget';
import { HomepageWidget } from '../homepage-widget/homepage-widget';
import { PortfolioComposition } from '../../portfolio/portfolio-composition/portfolio-composition';
import { HoldingsList } from '../../portfolio/holdings/holdings-list';
import { ActivityList } from '../../trading/activity-list/activity-list';
import { Account, AccountsList } from '../../account/accounts-list/accounts-list';
import { AuthService } from '../../auth/auth/auth.service';
import { InstrumentSearch } from '../../trading/instrument-search/instrument-search';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { PortfolioPrompt } from '../../portfolio/portfolio-prompt/portfolio-prompt';


@Component({
  imports: [HomepageWidget, AccountsList, InstrumentSearch, MatDialogModule], // imports to the template
  selector: 'app-home-page',
  styleUrl: './home-page.css',
  templateUrl: './home-page.html',
})
export class HomePage {
  readonly authService = inject(AuthService);
  private readonly accountsService = inject(AccountsService);
  private readonly dialog = inject(MatDialog);
  private promptShown = false;

  constructor() {
    effect(() => {
      const userId = this.authService.currentUserId();
      const loaded = this.accountsService.loaded();
      const hasPortfolios = this.accountsService.accounts().length > 0;

      if (userId && loaded && !hasPortfolios && !this.promptShown) {
        this.promptShown = true;
        this.dialog.open(PortfolioPrompt, {
          width: 'min(92vw, 30rem)',
          maxWidth: '100vw',
          autoFocus: false,
        });
      }
    });
  }

  // give the data for the widget
  data: Widget[] = [
    {
      id: "pp",
      label: "Portfolio Performance",
      content: PortfolioPerformance,
      inputs: {
        showTimeFrame: true
      }
    }, {
      id: "pc",
      label: "Portfolio Composition",
      content: PortfolioComposition,
    }, {
      id: "ph",
      label: "Portfolio Holdings",
      content: HoldingsList,
      inputs: {
        showLess: true,
      },
      route: "/holdings"
    }, {
      id: "aa",
      label: "Account Activity",
      content: ActivityList,
      inputs: {
        showLess: true,
      },
      route: "/history"
    }]

}
