import {Injectable, Injector} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SadieProjectsService {

  constructor(private http: HttpClient, public router: Router) {}
  async getUserProjects() {
    const res = await this.http.get('projects').toPromise();
    return res;
  }

}
