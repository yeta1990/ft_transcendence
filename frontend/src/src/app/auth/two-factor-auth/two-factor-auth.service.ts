import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TwoFAService {

  constructor(private http: HttpClient) { }

  getSecret(): Observable<any> {
    return this.http.get<any>(environment.apiUrl + '/ruta/para/obtener/secreto');
  }
}
