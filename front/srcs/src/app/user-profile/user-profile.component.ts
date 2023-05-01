import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from '../user';
import { UserProfileService } from './user-profile.service';
import { AuthService } from '../auth.service';

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
    private activateroute: ActivatedRoute
	){
		this.profileService.getUserProfile(parseInt(this.activateroute.snapshot.paramMap.get('id') || '0'))
			.subscribe((response: User) => {
				this.user = response;
        console.log(this.user.nick);
			});
	}
}
