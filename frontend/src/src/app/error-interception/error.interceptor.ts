import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable,  throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private authservice: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError(err => {
      console.log(err);
      if ([401, 403].includes(err.status)) {
      	  if (err.error?.message.includes("token"))
      		{
      	    	this.authservice.logout();
      		} else if (this.authservice.isLoggedIn())
      	  {
			 this.authservice.redirectToHome();
      	  }
      	  else {
      	    this.authservice.logout();
          }
      }
      //Add here future catch errors if...()

//		console.log("Catched HTTP error!");
      const error = err.error?.message || err.statusText;


      return throwError(() => new Error(error));
    }))
  }
}
