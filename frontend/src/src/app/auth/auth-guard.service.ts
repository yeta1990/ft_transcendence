import { Injectable } from '@angular/core';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService  {

	constructor(public auth: AuthService, public router: Router) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {

		if (!this.auth.isLoggedIn()){
		    const tree: UrlTree = this.router.parseUrl('/login');
    		return tree;	
		}
		return true;
	}

}
