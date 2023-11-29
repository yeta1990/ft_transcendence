import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ValidationFunctions } from '@shared/user.functions'

@Injectable({
  providedIn: 'root',
})
export class ValidationService {
  constructor(
    private http: HttpClient,
    private validationFunctions: ValidationFunctions ) {}

  checkNickAvailability(data: { nick: string }): void {
    if (!this.http.post(environment.apiUrl + '/edit-profile/check-nick', data)) {
        throw new Error('Nick not available');
    }
  }

  checkEmail( email: string ) : { success: boolean, message?: string } {
    try {
      this.validationFunctions.ValidateEmail(email);
      const [nombre, resto] = email.split('@');
      const [dominio, tld] = resto.split('.');
      this.validationFunctions.ValidateLength(nombre, 'email', 1, 64);
      this.validationFunctions.ValidateLength(dominio, 'email', 1, 255);
      this.validationFunctions.ValidateLength(tld, 'email', 2, 10);
      return { success: true };
    } catch (error : any) {
      return { success: false, message: error.message };
    }
  }

  checkName( name : string ) : { success: boolean, message?: string } {
    try {
    this.validationFunctions.ValidateName(name);
    this.validationFunctions.ValidateLength(name, 'First Name', 2, 46);
    return { success: true };
    } catch (error : any) {
      return { success: false, message: error.message };
    }
  }

  checkLastName( name : string ) : { success: boolean, message?: string } {
    try {
    this.validationFunctions.ValidateLastName(name);
    this.validationFunctions.ValidateLength(name, 'Last Name', 2, 46);
    return { success: true };
    } catch (error : any) {
      return { success: false, message: error.message };
    }
  }

    checkNick( nick : string ) : { success: boolean, message?: string } {
    try {
      this.validationFunctions.ValidateLength(nick, 'Nick', 8, 8);
      this.validationFunctions.ValidateNickAlpha(nick);
      this.checkNickAvailability({ nick: nick });
      return { success: true };
    } catch (error : any) {
      return { success: false, message: error.message };
    }
  }
  
}
