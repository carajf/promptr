import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDivider } from '@angular/material/divider';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatDivider],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Promptr';
}
