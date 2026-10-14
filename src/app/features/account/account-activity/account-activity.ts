import { Component, input } from '@angular/core';
import { ActivityList } from '../../trading/activity-list/activity-list';

@Component({
  selector: 'app-account-activity',
  imports: [ActivityList],
  templateUrl: './account-activity.html',
  styleUrl: './account-activity.css',
})
export class AccountActivity {
  clientId = input<string | null>(null);
}
