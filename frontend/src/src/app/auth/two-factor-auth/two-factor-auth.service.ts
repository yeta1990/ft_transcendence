import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface SecretResponse {
  message: string;
  secret: string;
}

@Injectable({
  providedIn: 'root'
})
export class TwoFAService {

  constructor(private http: HttpClient) { }

  getSecret(): Observable<SecretResponse> {
    return this.http.get<any>(environment.apiUrl + '/auth/get-secret', this.newUser)
    .subscribe((response: SecretResponse) => {
      console.log(response.message)
    });
  }
}