import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { Path } from 'three';


@Injectable({
  providedIn: 'root'
})


export class ApiFetchService {

  private apiUrl = 'http://10.91.89.91:3003';
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



@Injectable({
  providedIn: 'root'
})

export class JsonFetchService {

  private Base_dir = './repos/';

  constructor(private http: HttpClient) {}
  
  agcFolders: string[] = [];
  
  get_fetch_dirs(subDir: string): { observable: Observable<string[]>, baseDir: string } {
    const tmp_path = this.Base_dir + subDir + "/data.json";
    return {
      observable: this.http.get<string[]>(tmp_path),
      baseDir: this.Base_dir
    };
  }
}
