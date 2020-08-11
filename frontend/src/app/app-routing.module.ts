import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {LoginComponent} from './login/login.component';
import {LoginService} from '@services/login.service';
import {AgGridModule} from 'ag-grid-angular/main';
import { AgGridSelectFilterComponent } from '@components/ag-grid/ag-grid-select-filter.component';


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
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    AgGridModule.withComponents([AgGridSelectFilterComponent])
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
