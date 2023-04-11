import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

//https://medium.com/@gokulbudha/interceptors-in-angular-aee9b247d4c5
//https://blog.angular-university.io/angular-jwt-authentication/
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    intercept(req: HttpRequest<any>,
              next: HttpHandler): Observable<HttpEvent<any>> {

        const accessToken = localStorage.getItem("access_token");

        if (accessToken) {
            const cloned = req.clone({
                headers: req.headers.set("Authorization",
                    "Bearer " + accessToken)
            });

            return next.handle(cloned);
        }
        else {
            return next.handle(req);
        }
    }
}
