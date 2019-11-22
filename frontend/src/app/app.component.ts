import { Component } from '@angular/core';
import { Http, Response } from '@angular/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'frontend';
  url = 'http://localhost:4200/api/v1/projects/';
  constructor(private http: Http) {}
    public getProjects() {
        this.http.get(this.url).toPromise().then((res) => {
            return res.json();
        });
    }
}
