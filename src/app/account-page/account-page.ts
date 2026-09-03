import { Component } from '@angular/core';

@Component({
  selector: 'app-account-page',
  imports: [],
  templateUrl: './account-page.html',
  styleUrl: './account-page.css',
})
// account info (placeholder for now)
export class AccountPage {
  email = 'ArjunBhat67@hotmail.com';
  password = 'ArjunBhat67';
  dateCreated = '01/01/2000';

  //cover up password
  get maskedPassword(): string {
    return '•'.repeat(this.password.length);
  }
}
