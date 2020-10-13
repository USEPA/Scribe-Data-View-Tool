import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HTTP_INTERCEPTORS, HttpClientModule, HttpClientXsrfModule} from '@angular/common/http';
import {HttpRequestInterceptor} from './http-request.interceptor';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {AppRoutingModule} from './core/app-routing.module';
import {AppComponent} from './app.component';
import {AuthModule} from './auth/auth.module';

import {CustomMaterialModule} from './core/material.module';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from '@components/header/header.component';
import {AgGridModule} from 'ag-grid-angular';
import { AgGridComponent } from '@components/ag-grid/ag-grid.component';
import { AgGridSelectFilterComponent } from '@components/ag-grid/ag-grid-select-filter.component';
import { MapViewComponent } from '@components/map-view/map-view.component';
import { VisibleColumnsDialogComponent } from '@components/visible-columns-dialog/visible-columns-dialog.component';
import { ProjectsMapDialogComponent } from '@components/projects-map-dialog/projects-map-dialog.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    AgGridComponent,
    AgGridSelectFilterComponent,
    MapViewComponent,
    VisibleColumnsDialogComponent,
    ProjectsMapDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    CustomMaterialModule,
    ReactiveFormsModule,
    AgGridModule,
    AuthModule,
    HttpClientXsrfModule.withOptions({
      cookieName: 'csrftoken',
      headerName: 'X-CSRFToken'
    }),
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: HttpRequestInterceptor,
    multi: true
  }],
  entryComponents: [
    VisibleColumnsDialogComponent,
    ProjectsMapDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
