import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MyProfileService } from '../my-profile/my-profile.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  constructor(
		private profileService: MyProfileService,
		private authService: AuthService,
		private router: Router
	){
		if (this.authService.isLoggedIn())
		{
			this.router.navigateByUrl('/home');
		}else{
			this.router.navigateByUrl('/login');
		}

	}
  allUsers(): void {
	}
}
