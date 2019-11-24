import { Component } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  routes = [
    { path: '/', name: 'Home' }
  ];
  url = 'http://localhost:4200/api/v1/projects/';
  constructor(private http: HttpClient) {}
    public getProjects() {
        this.http.get(this.url).toPromise().then((res) => {
            return res;
        });
    }
}
