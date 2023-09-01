import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, Validators, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { FormService } from './form.service';
import { User } from '../user';
import { ValidationFunctions } from '@shared/user.functions'
import { AuthService } from '../auth/auth.service';
import { Campuses } from '@shared/enum';
import { HttpClient } from '@angular/common/http';

const MatchPassword : ValidatorFn = (control : AbstractControl) : ValidationErrors | null => {
	  const passwordControl = control.get('password');
	  const confirmPasswordControl = control.get('cPassword');

	  if (!passwordControl || !confirmPasswordControl) {
		  return null;
		}
		
	  if (confirmPasswordControl.errors && !confirmPasswordControl.errors['passwordMismatch']) {
		return null;
	  }

	  console.log('Password is ' + passwordControl?.value);
	  console.log('cPassword is ' + confirmPasswordControl?.value);

	  if (passwordControl.value !== confirmPasswordControl.value) {
		confirmPasswordControl.setErrors({ ['passwordMismatch']: true });
	  } else {
		confirmPasswordControl.setErrors(null);
	  }
	  return null;
	}

function patternValidator(patternValidatorFn: (value: string) => boolean): ValidatorFn {
	return (control: AbstractControl): { [key: string]: any } | null => {
		const isValid = patternValidatorFn(control.value);
		return isValid ? null : { invalidPattern: true };
	};
	}

@Component({
	selector: 'app-form',
	templateUrl: './form.component.html',
	styleUrls: ['./form.component.css']
	})

export class FormComponent implements OnInit {
	
	campusesTypes = Object.keys(Campuses);
	profileForm!: FormGroup;
	newUser: User = new User({} as User);
	newPassword = '';
	newCPassword = '';
	submitted = false;

	constructor(
		private fb: FormBuilder,
		private formService: FormService,
		private router: Router,
		private authService: AuthService,
		private validators: ValidationFunctions,
		private http: HttpClient
		){ }
		
	ngOnInit() {
			this.initForm();
		}

	initForm() {
		this.profileForm = this.fb.group ({
			nick: ['', Validators.required, this.usernameValidator.bind(this)],
			email: ['', [Validators.required, Validators.email]],
			firstName: [''],
			lastName: [''],
			login: [''],
			campus: new FormControl(this.campusesTypes[0]),
			mfa: [false],
			mfaSecret: [''],
			image: [''],
			status: [''],
			achievements: [[]],
			wins: [0],
			winningStreak: [0],
			losses: [0],
			elo: [0],
			password: ['', Validators.compose([Validators.required, patternValidator(this.validators.PatternValidator)])],
			cPassword: ['', Validators.required]
		}, {
			validators: [ MatchPassword ],
		});
	}

	signIn(): void{
		console.log("Idiot, this is signIn");
	}

	onSubmit(): void {
		console.log('Hey, Idiot');
		console.warn(this.profileForm.value);
		if (this.profileForm.invalid) {
			console.log('Idiot, this is not valid');
			return;
		  }
		
		this.newUser.campus = this.profileForm.value.campus;
		this.newUser.firstName = this.profileForm.value.firstName;
		this.newUser.lastName = this.profileForm.value.lastName;
		this.newUser.nick = this.profileForm.value.nick;
		this.newUser.email = this.profileForm.value.email;
		this.newPassword = this.profileForm.value.password;
		this.newCPassword = this.profileForm.value.cPassword;
		
		
		console.log("submit form ", this.profileForm.value);
		this.formService.addUser( this.profileForm.value as User)
			.subscribe(
	        response => {
	          console.log('Usuario creado:', response);
	        },
	        error => {
	          console.error('Error al crear el usuario:', error);
	        },
	        () => {
				console.log('Completado');
				console.log(this.newUser);
				this.router.navigateByUrl('/login');
	        }
		);
	}

	async usernameValidator(control: AbstractControl): Promise<any> {
		const userName = control.value;
		const isValidLocal = await ValidationFunctions.UsernameValidator(userName);
		if (!isValidLocal) {
			return { userNameNotAvailable: true };
		  }
		
		  const isValidDB = await this.formService.checkUsername(userName);
		  return isValidDB ? null : { userNameNotAvailable: true };
	  }


}

