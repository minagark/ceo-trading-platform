import { Component, input } from '@angular/core';
import type { Widget } from '../shared/models/widget';
import { NgComponentOutlet } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  imports: [NgComponentOutlet, MatCardModule, RouterLink],
  selector: 'app-homepage-widget',
  styleUrl: './homepage-widget.css',
  templateUrl: './homepage-widget.html',
})
export class HomepageWidget {

  data = input.required<Widget>();

}
