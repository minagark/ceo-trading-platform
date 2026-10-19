import { Component, inject } from '@angular/core';
import { AccountsList } from '../../account/accounts-list/accounts-list';
import { HoldingsList } from '../holdings/holdings-list';
import { AuthService } from '../../auth/auth/auth.service';

@Component({
  selector: 'app-portfolio-holdings-page',
  imports: [AccountsList, HoldingsList],
  templateUrl: './portfolio-holdings-page.html',
  styleUrl: './portfolio-holdings-page.css',
})
export class PortfolioHoldingsPage {
  readonly authService = inject(AuthService);
}
