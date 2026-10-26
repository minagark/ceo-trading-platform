import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  imports: [MatDialogModule, MatButtonModule],
  selector: 'app-portfolio-prompt',
  styleUrl: './portfolio-prompt.css',
  templateUrl: './portfolio-prompt.html',
})
export class PortfolioPrompt {
  private readonly dialogRef = inject(MatDialogRef<PortfolioPrompt>);
  private readonly router = inject(Router);

  createPortfolio(): void {
    this.dialogRef.close();
    void this.router.navigate(['/create-portfolio']);
  }

  dismiss(): void {
    this.dialogRef.close();
  }

}
