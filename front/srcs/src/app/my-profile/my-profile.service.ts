import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../user';

@Injectable({
  providedIn: 'root'
})
export class MyProfileService {

	constructor(private httpClient: HttpClient) {}

	getUserDetails(): Observable<User> {
		return this.httpClient.get<User>('http://localhost:3000/auth/profile')
	}
}
