import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {count, filter, tap} from 'rxjs/operators';

import {LoginService} from '../../auth/login.service';

import {FormControl, Validators} from '@angular/forms';
import {ScribeDataExplorerService} from '@services/scribe-data-explorer.service';
import {AGOLService, Project} from '../../projectInterfaceTypes';
import {environment} from "@environments/environment";


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  projects = new FormControl();

  constructor(public loginService: LoginService, public scribeDataExplorerService: ScribeDataExplorerService,
              private router: Router) {
    // The header component loads first and some properties of the scribeDataExplorerServices are set.
    this.loginService.currentUser.subscribe(user => {
      this.scribeDataExplorerService.agolUsername = user.agol_username;
      this.scribeDataExplorerService.agolToken = user.agol_token;
      this.scribeDataExplorerService.agolUserContentUrl = `${environment.user_geo_platform_url}/sharing/rest/content/users/${user.agol_username}`;
    });

  }

  ngOnInit() {
    // The other properties and method calls of the scribeDataExplorerService are done in the ngOninit
    // of the header to give time to the async call to be performed.
  }

  logout() {
    this.loginService.logout().then((result) => {
      this.router.navigate(['login']);
    }).catch((error) => {
      // console.log(error);
      this.router.navigate(['login']);
    });
  }

  display(){
    console.log(`user name in constructor ${this.scribeDataExplorerService.agolUsername}`);
  }

}
