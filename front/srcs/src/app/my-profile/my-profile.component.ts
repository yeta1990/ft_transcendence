import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../user';
import { MyProfileService } from './my-profile.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {

	user: User | undefined;

	//why subscribe? https://stackoverflow.com/questions/68006823/angular-11-type-observableobject-is-missing-the-following-properties-from-ty
	constructor(
		private profileService: MyProfileService,
		private authService: AuthService,
		private router: Router
	){
		this.profileService.getUserDetails() //this returns an Observable<User>, not a <User>
			.subscribe((response: User) => { //so subscribe waits for the async call to the backend
				this.user = response;
			});
	}
	logout(): void {
		console.log("log out");
		this.authService.logout();
		this.router.navigateByUrl('/login');
	}
	ngOnInit(): void {	

	}
	allUsers(): void {
		console.log("All users login list:");
		this.router.navigateByUrl('/all-users');
	}
}
