import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})


export class ApiFetchService {

  private apiUrl = 'http://10.91.89.80:3003';
  private saltKey = 'Clove@$martCity';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      
      'X-Salt-Key': this.saltKey
    });
  }

  get_list_projs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get_projects_mast`,
      {
        headers: this.getAuthHeaders()
      }
    );
  }
  
  getListMethod1(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/method1`,
      {
        headers: this.getAuthHeaders()
      }
    );
  }
}
