import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {LoginComponent} from './login/login.component';
import {LoginService} from './services/login.service';
import {OauthcallbackComponent} from './oauthcallback/oauthcallback.component';


const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [LoginService],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'oauthcallback',
    component: OauthcallbackComponent
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
