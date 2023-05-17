import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../user';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AllUsersService {

	constructor(private httpClient: HttpClient) {}

	getUsers(): Observable<User[]> {
		return this.httpClient.get<User[]>(environment.apiUrl + '/user/all')
	}
}
