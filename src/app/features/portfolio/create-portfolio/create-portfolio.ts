import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { PortfolioApiService } from '../data-access/portfolio-api.service';
import { PortfolioType } from '../../../core/trading.models';

@Component({
  imports: [MatSelectModule, MatFormFieldModule, MatCardModule, MatRadioModule],
  selector: 'app-create-portfolio',
  styleUrl: './create-portfolio.css',
  templateUrl: './create-portfolio.html',
})
export class CreatePortfolio {
  portfolioType: FormControl;
  readonly portfolioApi = inject(PortfolioApiService);

  constructor(private fb: FormBuilder) {
    this.portfolioType = new FormControl('');
  }

  createPortfolio(portfolioType: PortfolioType) {
    console.log('Creating portfolio with type:', this.portfolioType.value);
    const clientId = this.authService.currentUserId();
    this.portfolioApi.createPortfolio(portfolioType, clientId).subscribe({
    });
  }
}
