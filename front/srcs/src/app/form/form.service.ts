import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User} from '../user';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type':  'application/json',
    Authorization: 'my-auth-token'
  })
};

@Injectable({
  providedIn: 'root'
})

export class FormService {

	errorMessage: string = '';
	private handleError(error: HttpErrorResponse, user: User) {
		console.error('An error ocurred:', error.error);
		throw new Error();
	}

	addUser(user: User): Observable<User>{
		return this.http.post<any>("http://localhost:3000/user", user)
	}
  constructor(private http: HttpClient) { }
}
