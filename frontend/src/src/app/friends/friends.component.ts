import { Component } from '@angular/core';
import { AllUsersService } from '../all-users/all-users.service'
import { AuthService } from '../auth/auth.service'
import {UserProfileService} from '../user-profile/user-profile.service'
import {User} from '../user'

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent {

	friends: User[] = []
	allUsers: User[] = []
	incomingFriendRequests: User[] = []
	myLogin: string;
	constructor(private usersService: AllUsersService, private authService: AuthService, private userProfileService: UserProfileService) {
		this.myLogin = this.authService.getUserNameFromToken() as string
		this.usersService.getUsers()
			.subscribe(r=> {
				this.allUsers = r
				this.friends = r.filter(u => u.friends.includes(this.myLogin))
				let friendRequestsLogins: string[];
				this.allUsers.map(u => {if (u.login === this.myLogin) friendRequestsLogins = u.incomingFriendRequests})
				this.incomingFriendRequests = this.allUsers.filter(u => friendRequestsLogins.includes(u.login))
			})
//		this.userProfileService.getMyIncomingFriendRequests
//			.subscribe(r => this.incomingFriendRequests = r)

	}

	

}
