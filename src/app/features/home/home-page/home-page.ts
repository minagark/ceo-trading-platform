import { Component, inject, signal } from '@angular/core';
import { PortfolioPerformance } from '../../portfolio/portfolio-performance/portfolio-performance';
import type { Widget } from '../../../shared/models/widget';
import { HomepageWidget } from '../homepage-widget/homepage-widget';
import { PortfolioComposition } from '../../portfolio/portfolio-composition/portfolio-composition';
import { HoldingsList } from '../../portfolio/holdings/holdings-list';
import { ActivityList } from '../../trading/activity-list/activity-list';
import { Account, AccountsList } from '../../account/accounts-list/accounts-list';
import { AuthService } from '../../auth/auth/auth.service';
import { InstrumentSearch } from '../../trading/instrument-search/instrument-search';


@Component({
  imports: [HomepageWidget, AccountsList, InstrumentSearch], // imports to the template
  selector: 'app-home-page',
  styleUrl: './home-page.css',
  templateUrl: './home-page.html',
})
export class HomePage {
  readonly authService = inject(AuthService);

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
