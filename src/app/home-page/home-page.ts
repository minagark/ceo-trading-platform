import { Component } from '@angular/core';
import { PortfolioPerformance } from '../portfolio-performance/portfolio-performance';
import type { Widget } from '../shared/models/widget';
import { HomepageWidget } from '../homepage-widget/homepage-widget';
import { PortfolioComposition } from '../portfolio-composition/portfolio-composition';
import { HoldingsList } from '../holdings/holdings-list';
import { AccountActivity } from '../account-activity/account-activity';


@Component({
  imports: [HomepageWidget], // imports to the templae
  selector: 'app-home-page',
  styleUrl: './home-page.css',
  templateUrl: './home-page.html',
})
export class HomePage {

  // give the data for the widget
  data: Widget[] = [
    {
      id: "pp",
      label: "Portfolio Performance",
      content: PortfolioPerformance,
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
      }
    }, {
      id: "aa",
      label: "Account Activity",
      content: AccountActivity,
      inputs: {
        showLess: true,
      }
    }]

}
