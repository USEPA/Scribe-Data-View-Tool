import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isLoaded: boolean;
  routes = [
    { path: '/', name: 'Home' },
    { path: 'logout', name: 'Logout' },
  ];

  constructor() {
    this.isLoaded = false;
  }

  ngOnInit() {
    console.log('loading');
  }
}
