import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../user';
import { environment } from '../../environments/environment';
import {HttpParams} from "@angular/common/http";

    

@Injectable({
  providedIn: 'root'
})
export class AdminPageService {
	constructor(private httpClient: HttpClient) {}

	removeAdminPrivileges(login: string): Observable<User[]> {
		return this.httpClient.post<User[]>(environment.apiUrl + '/user/remove-admin?login='+login, "")
	}

	grantAdminPrivileges(login: string): Observable<User[]> {
		return this.httpClient.post<User[]>(environment.apiUrl + '/user/grant-admin?login='+login, "")
	}

	banUser(login: string): Observable<User[]> {
		return this.httpClient.post<User[]>(environment.apiUrl + '/user/ban?login='+login, "")
	}

	removeBanUser(login: string): Observable<User[]> {
		return this.httpClient.post<User[]>(environment.apiUrl + '/user/unban?login='+login, "")
	}
}
