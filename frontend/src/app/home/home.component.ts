import { Component, OnInit } from '@angular/core';
import {AppComponent} from '../app.component';
import {LoginService} from '../services/login.service';
import {Project, ProjectSample, SadieProjectsService} from '../services/sadie-projects.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isLoaded: boolean;
  selectedProject: string;
  userProjects: Project[];
  projectSamples: ProjectSample[];

  constructor(public app: AppComponent,
              public loginService: LoginService,
              public sadieProjectsService: SadieProjectsService) {
    this.isLoaded = false;
  }

  async ngOnInit() {
    if (this.loginService.access_token) {
      try {
        this.userProjects = await this.sadieProjectsService.getUserProjects();
        this.isLoaded = true;
      } catch (err) {
        this.isLoaded = false;
      }

    }
  }

  async projectChanged(selectedProjectId) {
    this.projectSamples = await this.sadieProjectsService.getProjectSamples(selectedProjectId);
  }

}
