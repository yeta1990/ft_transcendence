import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { User } from '../user';
import { AuthService } from '../auth.service';

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

	onSubmit(): void{
		const val = this.loginForm.value;
/*
        if (val.email && val.nick) {
            this.authService.login(val.nick, val.email)
                .subscribe(
                    () => {
                        console.log("User is logged in");
                        this.router.navigateByUrl('/my-profile');
                    }
                );
        }
        */
	}
}
