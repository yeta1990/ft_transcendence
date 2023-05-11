import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

	constructor(public auth: AuthService, public router: Router) { }

	canActivate(): boolean {
		if (!this.auth.isLoggedIn()){
			this.router.navigateByUrl('/login');
//			this.router.navigate(['login']);
			return false;
		}
		return true;
	}

}
