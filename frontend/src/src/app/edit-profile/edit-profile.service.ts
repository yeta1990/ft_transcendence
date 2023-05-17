import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { User } from '../user';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EditProfileService {

  constructor(private httpClient: HttpClient) {}

  editProfile(user: User) {
   // return this.httpClient.post<User>(environment.apiUrl + '/user/edit')
  }  
}
