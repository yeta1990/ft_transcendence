import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ValidationService {
  constructor(private http: HttpClient) {}

  checkNickAvailability(data: { nick: string }): Observable<any> {
    return this.http.post(environment.apiUrl + '/edit-profile/check-nick', data);
  }
  
}
