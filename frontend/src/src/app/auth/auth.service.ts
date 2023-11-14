import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../user';
import { BehaviorSubject, Observable, of } from "rxjs";
import { tap, shareReplay, catchError, map } from "rxjs/operators";
import * as moment from "moment";
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import * as jwt_decode from 'jwt-decode';
import { ChatService } from '../chat/chat.service'

@Injectable({
  providedIn: 'root'
})

export class AuthService {

	constructor(
        private http: HttpClient,
        private router: Router,
		private chatService: ChatService
    ) { }
  private authToken: any;

  
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
		return this.http.post<any>(environment.apiUrl + '/auth/login', {code})
			.pipe(
				map((res: any) => {
					if (res.requiresMFA) {
						this.authToken = res.authResult;
					}
					else {
						this.setSession(res.authResult);
						this.redirectToHome();
					}
					return { requiresMFA: res.requiresMFA, userId: res.userId };
				}),
			shareReplay()
		);
	}

	logout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("expires_at");
		this.chatService.forceDisconnect();
        this.router.navigateByUrl('/login');
    }

	validateMfa(userId: number, loginCode: string) : Observable<boolean> {
		const message: string = "Token para validar mfa"
		return this.http.post<any>(environment.apiUrl + '/2fa/auth/', { userId, loginCode, message })
		.pipe(
			map(response =>{
				if (response) {
					console.log("El codigo está bien");
					this.setSession(this.authToken);
					this.redirectToHome();
					return true;
				}
				console.log("He recibido respuesta");
				return false;
			}),
			catchError((error) => {
				console.error('Error en la validación MFA:', error);
				return of(false);
			})
		);
	  }

	redirectToHome() {
        this.router.navigateByUrl('/home');
    }

	private setSession(authResult: any) {
		console.log("Consigo entrar en setSession");
		console.log(authResult);
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
	   		return jwt_decode.jwtDecode(token);
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

	getUserNameFromToken(): string | null {
		const token = this.getUserToken();
		console.log("I have a token");
		console.log(token);
		if (token) {
		  const decodedToken = this.getDecodedAccessToken(token);
		  console.log("My username is: " + decodedToken.login);
		  const userName = decodedToken?.login;
			return userName || null;
		}
		return null;
	  }

}
