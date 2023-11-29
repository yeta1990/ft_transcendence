import { Component, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { User } from '../user';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

	@Input() public isUserLoggedIn: boolean = false;
	username: string = '';
	password:string = '';
	showWarning: boolean = false;
	passwordEnabled: boolean = false;

	loginForm = this.formBuilder.group({
		nick: '',
		email: '',
	});

	constructor(
		private formBuilder: FormBuilder,
		private loginService: LoginService,
		private router: Router,
		private authService: AuthService
	) {}

	goTo42Oauth(): void{
		this.isUserLoggedIn = true;
		console.log("1--> " + this.isUserLoggedIn);
		window.location.href = 'https://api.intra.42.fr/oauth/authorize?client_id='+ environment.clientId42 +'&redirect_uri=' + environment.frontendUrl + '/callback&response_type=code';
	}

	onUsernameInput() {
		this.showWarning = this.username.length > 0 || this.password.length > 0;
	}

	onPasswordInput() {
		this.onUsernameInput();
	}

	onOAuth42MouseEnter() {
	}

	onOAuth42MouseLeave() {
	}
}
