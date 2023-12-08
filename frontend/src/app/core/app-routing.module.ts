import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {HomeComponent} from '../home/home.component';
import {LoginComponent} from '../auth/login/login.component';
import {LoginService} from '../auth/login.service';
import { AgGridSelectFilterComponent } from '@components/ag-grid/ag-grid-select-filter.component';
import {AgGridModule} from '@ag-grid-community/angular';

const routes: Routes = [
  {
    path: '', canActivate: [LoginService], children: [
      {path: '', component: HomeComponent},
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
    AgGridModule.withComponents([AgGridSelectFilterComponent])
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
