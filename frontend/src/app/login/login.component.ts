import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {LoginService} from '../services/login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: string;
  password: string;
  login_error: string;

  constructor(private loginService: LoginService, private route: ActivatedRoute, private router: Router) {
  }

  ngOnInit() {
  }

  login() {
    this.loginService.sendToLogin(this.route.snapshot.queryParams.next);
  }

  login(loginType: string) {
    const next = this.route.snapshot.queryParams.next ? this.route.snapshot.queryParams.next : '';
    this.loginService.sendToLogin(loginType, window.location.origin + next);
  }
}
