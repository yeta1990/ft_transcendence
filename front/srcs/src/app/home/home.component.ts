import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MyProfileService } from '../my-profile/my-profile.service';
import { AuthService } from '../auth.service';

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
	){}
  goHome(): void{
    console.log("Home");
		this.router.navigateByUrl('');
  }
  allUsers(): void {
		console.log("All users login list:");
		this.router.navigateByUrl('/all-users');
	}
}
