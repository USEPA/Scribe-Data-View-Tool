import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {switchMap, tap} from 'rxjs/operators';
import {LoginService} from '@services/login.service';

@Component({
  selector: 'app-oauthcallback',
  templateUrl: './oauthcallback.component.html',
  styleUrls: ['./oauthcallback.component.css']
})
export class OauthcallbackComponent implements OnInit {

  constructor(public route: ActivatedRoute, public loginService: LoginService, public router: Router) {
  }

  ngOnInit() {
    const next = this.route.snapshot.queryParams.next ? this.route.snapshot.queryParams.next : '';
    this.route.fragment.pipe(
      switchMap(async fragment => {
        const oauthParams = fragment.match('(access_token=)(.*)(&expires_in=)(.*)(&username=)(.*)(&ssl=)');
        const tokenResponse = await this.loginService.convertToken(oauthParams[2], oauthParams[4], oauthParams[6]);
        this.loginService.setAccessToken(tokenResponse.access_token, tokenResponse.expires_in);
        await this.loginService.getUserProps();
      }),
      tap(() => this.router.navigate([next], ))
    ).subscribe();
  }

}
