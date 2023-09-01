import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../user';
import { AllUsersService } from './all-users.service';
import { AuthService } from '../auth/auth.service';


@Component({
  selector: 'app-all-users',
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.css']
})
export class AllUsersComponent {

	users: User[] | undefined;

	constructor(
		private profileService: AllUsersService,
		private authService: AuthService,
		private router: Router
	){
		this.profileService.getUsers() 
			.subscribe((response: User[]) => { 
				this.users = response;
			});
	}
	getId(id: number): any {
		console.log("Id: " + id);
		this.router.navigateByUrl('/user-profile/' + id);
		return id;
	}
}

