import { Injectable } from '@angular/core';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { UserProfileService } from '../user-profile/user-profile.service';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserRole } from '@shared/enum';
import { Location } from '@angular/common'

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService  {

	constructor(
		public auth: AuthService,
		public router: Router,
		private userProfileService: UserProfileService,
		private location: Location
	) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
		
		console.log("Estoy intentando ver si puedes entrar");

		if (route.data && route.data['bothCheck']) {
			console.log("Me has pedido que compruebe ambos");
			return this.checkBothPermissions(route);
		}

		if (route.data && route.data['adminCheck']) {
			console.log("Me has pedido que compruebe adminCheck");
			return this.checkAdminPermissions();
		}
		
		if (route.data && route.data['userCheck']) {
			console.log("Me has pedido que compruebe userCheck");
			return this.checkUserPermissions(route);
		}

		if (route.data && route.data['logCheck']) {
			console.log("Me has pedido que compruebe si el usuario está loggeado");
			if (this.auth.isLoggedIn()) {
				return of(true);
			} else {
				console.log("OJO! el usuario no está identificado");
				return of(this.router.createUrlTree(['/login']));
			}
		}
		return of(true);
	}

	private checkAdminPermissions(): Observable<boolean | UrlTree> {
		// Comprueba si el usuario es administrador
		const token = this.auth.getDecodedAccessToken(this.auth.getUserToken() ?? '');
		if (token?.role === UserRole.ADMIN) {
			return of(true);
		}

		// Si no es administrador, redirige a la página principal o a otra página según tu lógica
		return of(this.router.createUrlTree(['/']));
	}

	private checkUserPermissions(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
		// Comprueba si el usuario es el "propio" usuario
		const login = route.paramMap.get('login');
		if (login !== null) {
			return this.userProfileService.getUserIDByLogin(login).pipe(
				switchMap((userId: number | null) => {
					if (!this.auth.isLoggedIn() || userId === null) {
						return of(this.router.createUrlTree(['/login']));
					}

					const token = this.auth.getDecodedAccessToken(this.auth.getUserToken() ?? '');
					const id = token?.id;

					if (id === userId) {
						return of(true);
					} else {
						// Si no es el "propio" usuario, redirige a la página principal u otra página según tu lógica
						return of(this.router.createUrlTree(['/']));
					}
				})
			);
		}

		// Si login es nulo, redirige a la página principal
		// Devuelve true por defecto para permitir al usuario seguir autenticado
		return of(true);
	}

	private checkBothPermissions(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
		// Realiza ambas comprobaciones
		return forkJoin([
		  this.checkAdminPermissions(),
		  this.checkUserPermissions(route)
		]).pipe(
		  map(([isAdmin, isUser]) => {
			// Si eres admin o el usuario propio, tienes permiso
			if (isAdmin === true || isUser === true) {
			  return true;
			}
			// Si no tienes permiso, devuelve la UrlTree raíz
			return this.router.createUrlTree(['/']);
		  }),
		  catchError(() => of(this.router.createUrlTree(['/']))) // Manejo de errores
		);
	  }
	  
	
}
