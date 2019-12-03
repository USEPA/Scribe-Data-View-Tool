import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {OauthcallbackComponent} from './oauthcallback/oauthcallback.component';
import {LoginService} from '@services/login.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {
  MatToolbarModule, MatMenuModule, MatListModule, MatCardModule, MatFormFieldModule, MatSelectModule,
  MatButtonModule, MatDialogModule, MatIconModule
} from '@angular/material';
import {FormsModule} from '@angular/forms';
import {HttpRequestInterceptor} from './http-request.interceptor';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from '@components/header/header.component';
import { AgGridComponent } from '@components/ag-grid/ag-grid.component';
import {AgGridModule} from 'ag-grid-angular';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    OauthcallbackComponent,
    HomeComponent,
    HeaderComponent,
    AgGridComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatMenuModule,
    AgGridModule
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
