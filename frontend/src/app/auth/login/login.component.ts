import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {LoginService} from '../login.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private loginService: LoginService, private route: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
  }

  login() {
    const next = this.route.snapshot.queryParams.next ? this.route.snapshot.queryParams.next : '';
    this.loginService.sendToLogin(window.location.origin + next);
  }
}
