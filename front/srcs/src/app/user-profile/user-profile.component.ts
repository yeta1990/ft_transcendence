import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from '../user';
import { UserProfileService } from './user-profile.service';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {

  user: User | undefined;

  constructor(
		private profileService: UserProfileService,
		private authService: AuthService,
		private router: Router,
    	private activateroute: ActivatedRoute,
	){
		this.profileService.getUserProfile(parseInt(this.activateroute.snapshot.paramMap.get('id') || '0'))
			.subscribe((response: User) => {
				this.user = response;
        console.log(this.user.nick);
			});
	}
	allUsers(): void {
		console.log("All users login list:");
		this.router.navigateByUrl('/all-users');
	}
}