import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {tap} from 'rxjs/operators';

import {LoginService} from '../../auth/login.service';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  constructor(public loginService: LoginService, private router: Router) {}

  ngOnInit() {
  }

  logout() {
    this.loginService.logout().then((result) => {
      this.router.navigate(['login']);
    }).catch((error) => {
      // console.log(error);
      this.router.navigate(['login']);
    });
  }

}
