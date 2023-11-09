import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { of } from 'rxjs';
import { User } from '../user';
import { environment } from '../../environments/environment';
import { Achievement } from '@shared/achievement';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  constructor(private httpClient: HttpClient) {}

  getUserIDByLogin(login: string): Observable<number> {
		return this.httpClient.get<number>(environment.apiUrl + '/user/id/' + login)
	}

  getUserProfile(id: number): Observable<User> {
		return this.httpClient.get<User>(environment.apiUrl + '/user/' + id)
	}

  getUserAchievements(id: number): Observable<Achievement[]> {
    return this.httpClient.get<Achievement[]>(environment.apiUrl + '/user/' + id + '/achievements')
      .pipe(
        catchError((error: any) => {
          console.error('Error getting user achievements:', error);
          return of([]); // Return an empty array in case of error
        })
      );
  }

  getMyBlockedUsers(): Observable<Array<string>> {
	return this.httpClient.get<Array<string>>(environment.apiUrl+'/user/my-blocked')
  }

	blockUser(login: string) {
		return this.httpClient.post<Array<string>>(environment.apiUrl+'/user/block?login='+login, {})
	}

	unBlockUser(login: string) {
		return this.httpClient.post<Array<string>>(environment.apiUrl+'/user/unblock?login='+login, {})
	}

}
