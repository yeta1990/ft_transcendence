import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { User } from '../user';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

	loginForm = this.formBuilder.group({
		nick: '',
		email: '',
	});

	constructor(
		private formBuilder: FormBuilder,
		private loginService: LoginService,
		private router: Router,
		private authService: AuthService,
	) {}

	goTo42Oauth(): void{
		window.location.href = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-8a6f2fa2b390840637041ee38b7e930881c496975d8123b200f71aac854c7c02&redirect_uri=' + environment.frontendUrl + '/callback&response_type=code';
	}


}
