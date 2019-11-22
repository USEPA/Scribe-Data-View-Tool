import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {LoginComponent} from './login/login.component';
import {OauthcallbackComponent} from './oauthcallback/oauthcallback.component';


const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'oauthcallback', component: OauthcallbackComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
