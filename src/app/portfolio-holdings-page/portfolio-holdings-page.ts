import { Component, signal } from '@angular/core';
import { AccountsList, Account } from '../accounts-list/accounts-list';
import { HoldingsList } from '../holdings/holdings-list';

@Component({
  selector: 'app-portfolio-holdings-page',
  imports: [AccountsList, HoldingsList],
  templateUrl: './portfolio-holdings-page.html',
  styleUrl: './portfolio-holdings-page.css',
})
export class PortfolioHoldingsPage {

}
