import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {LoginService} from '@services/login.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {
  MatInputModule, MatToolbarModule, MatMenuModule, MatListModule, MatCardModule, MatFormFieldModule, MatSelectModule,
  MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, MatTabsModule, MatSnackBarModule,
  MatChipsModule, MatCheckboxModule, MatSidenavModule, MatGridListModule
} from '@angular/material';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpRequestInterceptor} from './http-request.interceptor';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from '@components/header/header.component';
import { AgGridComponent } from '@components/ag-grid/ag-grid.component';
import {AgGridModule} from 'ag-grid-angular';
import { AgGridSelectFilterComponent } from '@components/ag-grid/ag-grid-select-filter.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { VisibleColumnsDialogComponent } from './components/visible-columns-dialog/visible-columns-dialog.component';
import { ProjectsMapDialogComponent } from './components/projects-map-dialog/projects-map-dialog.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
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
    ReactiveFormsModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatChipsModule,
    AgGridModule,
    MatGridListModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpRequestInterceptor,
      multi: true
    },
    LoginService],
  entryComponents: [
    VisibleColumnsDialogComponent,
    ProjectsMapDialogComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
