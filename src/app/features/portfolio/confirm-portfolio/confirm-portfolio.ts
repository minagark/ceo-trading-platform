import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PortfolioCreationService } from '../data-access/portfolio-creation.service';
import { MatListModule } from '@angular/material/list';
import { PortfolioApiService } from '../data-access/portfolio-api.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  imports: [MatCardModule, MatListModule, MatButtonModule],
  selector: 'app-confirm-portfolio',
  styleUrl: './confirm-portfolio.css',
  templateUrl: './confirm-portfolio.html',
})
export class ConfirmPortfolio implements OnInit{
  portfolioInfo: any;

  readonly portfolioCreationService = inject(PortfolioCreationService);
  readonly portfolioApi = inject(PortfolioApiService);
  readonly router = inject(Router);

  constructor() {}

  ngOnInit() {
    this.portfolioInfo = this.portfolioCreationService.getPortfolioData();
  }
  
  fundPortfolio() {
    const portfolioId = this.portfolioInfo?.ID;
    if (!portfolioId) {
      console.error('Cannot fund portfolio: backend portfolio ID is missing.', this.portfolioInfo);
      return;
    }

    this.router.navigate(['/trades'], {
      state: {
        portfolioId,
        orderType: 'DEPOSIT',
      }
    });
  }


}
