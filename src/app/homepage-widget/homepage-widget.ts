import { Component, input } from '@angular/core';
import type { Widget } from '../shared/models/widget';
import { NgComponentOutlet } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  imports: [NgComponentOutlet, MatCardModule],
  selector: 'app-homepage-widget',
  styleUrl: './homepage-widget.css',
  templateUrl: './homepage-widget.html',
})
export class HomepageWidget {

  data = input.required<Widget>();

}
