import {BrowserModule} from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {OauthcallbackComponent} from './oauthcallback/oauthcallback.component';
import {LoginService} from './services/login.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {
  MatToolbarModule, MatSidenavModule, MatListModule, MatCardModule,
  MatButtonModule, MatDialogModule, MatIconModule
} from '@angular/material';
import {HttpRequestInterceptor} from './http-request.interceptor';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    OauthcallbackComponent,
    HomeComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpRequestInterceptor,
      multi: true
    },
    LoginService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
