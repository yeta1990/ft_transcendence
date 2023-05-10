import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { FormService } from './form.service';
import { User } from '../user';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})

export class FormComponent {

	signupForm = this.formBuilder.group({
		name: '',
		nick: '',
		email: ''
	});

	constructor(
		private formBuilder: FormBuilder,
		private formService: FormService,
		private router: Router,
		private authService: AuthService,
	) {}

	onSubmit(): void {
		console.log("submit form ", this.signupForm.value);
		this.formService.addUser( this.signupForm.value as User)
			.subscribe(
	        response => {
	          console.log('Usuario creado:', response);
	        },
	        error => {
	          console.error('Error al crear el usuario:', error);
	        },
	        () => {
				console.log('Completado');
				this.router.navigateByUrl('/login');
	        }
		);
	}
}
