import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {LoginComponent} from './login/login.component';
import {OauthcallbackComponent} from './oauthcallback/oauthcallback.component';
import {LoginService} from './services/login.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {HttpClientModule} from '@angular/common/http';
import {MatCardModule} from '@angular/material';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    OauthcallbackComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatCardModule
  ],
  providers: [LoginService],
  bootstrap: [AppComponent]
})
export class AppModule { }
