import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from './user';
import { Observable } from "rxjs";
import { tap, shareReplay } from "rxjs/operators";
import * as moment from "moment";

@Injectable({
  providedIn: 'root'
})

export class AuthService {

	constructor(private http: HttpClient) { }

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
		return this.http.post<User>('http://localhost:3000/auth/login', {code})
			.pipe(tap((res: any) => this.setSession(res)))
			.pipe(shareReplay())
			//We are calling shareReplay to prevent the receiver of this Observable from accidentally triggering multiple POST requests due to multiple subscriptions.
	}

	logout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("expires_at");
    }

	private setSession(authResult: any) {
		console.log("setting session");
		console.log(authResult);
//		const expiresAt = moment().add(authResult.expires_at,'second');

        localStorage.setItem("access_token", authResult.access_token);
        localStorage.setItem("expires_at", authResult.expires_at);
//        localStorage.setItem("expires_at", JSON.stringify(expiresAt.valueOf()) );
    }

    public isLoggedIn() {
//    	console.log("is before? " + moment().second() + "," + this.getExpiration());
        return moment().isBefore(this.getExpiration());
    }

    isLoggedOut() {
        return !this.isLoggedIn();
    }

    getExpiration() {
        const expiration: string = localStorage.getItem("expires_at") || '';
        const expiresAt = JSON.parse(expiration);
        console.log(expiresAt);
        return moment(expiresAt);
    }
}
