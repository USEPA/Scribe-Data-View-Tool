import { Component, OnInit } from '@angular/core';
import {AppComponent} from '../app.component';
import {LoginService} from '../services/login.service';
import {SadieProjectsService} from '../services/sadie-projects.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isLoaded: boolean;
  selectedProject: string;
  userProjects: Promise<object>;

  constructor(public app: AppComponent,
              public loginService: LoginService,
              public sadieProjectsService: SadieProjectsService) {
    this.isLoaded = false;
  }

  ngOnInit() {
    if (this.loginService.access_token) {
      try {
        this.userProjects = this.sadieProjectsService.getUserProjects();
        console.log(this.userProjects);
        this.isLoaded = true;
      } catch (err) {
        this.isLoaded = false;
      }

    }
  }

}
