import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { PortfolioApiService } from '../data-access/portfolio-api.service';
import { PortfolioType } from '../../../core/trading.models';
import { AuthService } from '../../auth/auth/auth.service';
import { PortfolioCreationService } from '../data-access/portfolio-creation.service';
import { Router } from '@angular/router';

@Component({
  imports: [ReactiveFormsModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatCardModule, MatRadioModule, MatButtonModule],
  selector: 'app-create-portfolio',
  styleUrl: './create-portfolio.css',
  templateUrl: './create-portfolio.html',
})
export class CreatePortfolio {
  myForm: FormGroup;
  readonly portfolioApi = inject(PortfolioApiService);
  readonly authService = inject(AuthService);
  readonly portfolioCreationService = inject(PortfolioCreationService);
  readonly router = inject(Router);

  constructor(private fb: FormBuilder) {
    this.myForm = this.fb.group({
      portfolioName: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
      portfolioType: [''], // default
    });
  }

  onSubmit(): void {
    if (this.myForm.invalid) {
      return;
    }
    const portfolioName = (this.myForm.get('portfolioName')?.value as string).trim();
    const portfolioType = this.myForm.get('portfolioType')?.value as PortfolioType;
    console.log('Submitting portfolio form:', portfolioName, portfolioType);
    this.createPortfolio(portfolioName, portfolioType);
  }

  createPortfolio(portfolioName: string, portfolioType: PortfolioType) {
    console.log('Creating portfolio with type:', portfolioType);
    const clientId = this.authService.currentUserId();
    if (clientId != null) {
      this.portfolioApi.createPortfolio({ name: portfolioName, type: portfolioType, clientId }).subscribe({
        next: (response) => {
          console.log('Portfolio created successfully:', response);
          this.portfolioCreationService.setPortfolioData({
            ...response,
            portfolioType,
            clientId,
          });
          this.router.navigate(['/confirm-portfolio']);
        },
        error: (error) => {
          console.error('Error creating portfolio:', error);
        }
      });
    } else {
      console.error('No client ID found. User might not be authenticated.');
    }

  }
}
