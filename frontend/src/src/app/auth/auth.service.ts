import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../user';
import { Observable } from "rxjs";
import { tap, shareReplay } from "rxjs/operators";
import * as moment from "moment";
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})

export class AuthService {

	constructor(
        private http: HttpClient,
        private router: Router,) { }

/*
 *  old login function
 *
	login(nick: string, email: string){
		return this.http.post<User>('http://localhost:3000/auth/login', {nick, email})
			.pipe(tap((res: any) => this.setSession(res)))
			.pipe(shareReplay())
			//We are calling shareReplay to prevent the receiver of this Observable from accidentally triggering multiple POST requests due to multiple subscriptions.
	}
	*/

	login(code: string){
		return this.http.post<User>(environment.apiUrl + '/auth/login', {code})
			.pipe(tap((res: any) => this.setSession(res)))
			.pipe(shareReplay())
			//We are calling shareReplay to prevent the receiver of this Observable from accidentally triggering multiple POST requests due to multiple subscriptions.
	}

	logout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("expires_at");
        this.router.navigateByUrl('/login');
    }

	redirectToHome() {
        this.router.navigateByUrl('/my-profile');
    }

	private setSession(authResult: any) {
        localStorage.setItem("access_token", authResult.access_token);
        localStorage.setItem("expires_at", authResult.expires_at);
    }

    public isLoggedIn() {
    	let a:boolean = moment().isBefore(this.getExpiration());
    	return a;
    }

    isLoggedOut() {
        return !this.isLoggedIn();
    }

	getDecodedAccessToken(token: string): any {
		try {
	   		return jwt_decode(token);
		} catch(Error) {
			return null;
		}
	}

	//extra protected to handle different situations:
	//- if the token is not found
	//- or the token doesn't have an "exp" property
    getExpiration() {
		let expiration: number = 0;
		try {
			const decodedAccessToken = this.getDecodedAccessToken(this.getUserToken()!);

			expiration = parseInt(decodedAccessToken.exp) * 1000;
		} catch(Error) {
		}
        return moment(expiration);
    }

	getUserToken() {
		try { 
			return localStorage.getItem("access_token") || "{}"
		} catch (Error) {
			
		}
		return ;
	}

}
