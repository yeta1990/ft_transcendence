import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../user';

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

	private readonly backendURL = 'http://localhost:3000';

	errorMessage: string = '';
	private handleError(error: HttpErrorResponse, user: User) {
		console.error('An error ocurred:', error.error);
		throw new Error();
	}

	addUser(user: User): Observable<User>{
		const url = `${this.backendURL}/user`
		return this.http.post<any>(url, user)
	}

	constructor(private http: HttpClient) { }

	public async checkUsername(username: string): Promise<boolean> {
		const url = `${this.backendURL}/user/check-username`;
		const response = await firstValueFrom(this.http.post<{ isValid: boolean } | undefined>(url, { username }));
    return response?.isValid ?? false; // Maneja el caso de respuesta undefined
	  }
}
