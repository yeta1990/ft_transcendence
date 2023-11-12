import { Component } from '@angular/core';
import { AllUsersService } from '../all-users/all-users.service'
import { AuthService } from '../auth/auth.service'
import { ChatService } from '../chat/chat.service'
import {UserProfileService} from '../user-profile/user-profile.service'
import {User} from '../user'
import {ChatUser} from '@shared/types'
import {UserStatus} from '@shared/enum'

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
	constructor(private usersService: AllUsersService, private authService: AuthService, private profileService: UserProfileService, private chatService: ChatService) {
		this.myLogin = this.authService.getUserNameFromToken() as string
		this.usersService.getUsers()
			.subscribe(r=> {
				this.allUsers = r
				this.friends = r.filter(u => u.friends.includes(this.myLogin))
				let friendRequestsLogins: string[];
				this.allUsers.map(u => {if (u.login === this.myLogin) friendRequestsLogins = u.incomingFriendRequests})
				this.incomingFriendRequests = this.allUsers.filter(u => friendRequestsLogins.includes(u.login))
			})

	}

	getActiveUsers(): Array<ChatUser> {
		return this.chatService.getActiveUsers()
	}

	getUserStatus(login: string): UserStatus {
		return this.chatService.getUserStatus(login)
	}

	acceptFriendShipRequest(login:string){
		return this.profileService.acceptFriendShipRequest(login)
			.subscribe(r => {
				if (r) {

					this.incomingFriendRequests = this.incomingFriendRequests.filter(l => l.login != login)
					this.friends.push(this.allUsers.filter(u => u.login === login)[0])
					
				}
			})
	}

	rejectFriendshipRequest(login:string){
		return this.profileService.rejectFriendshipRequest(login)
			.subscribe(r => {
				if (r) {
					this.incomingFriendRequests = this.incomingFriendRequests.filter(l => l.login != login)
				}
			})
	}

	removeFriendship(login:string) {
		return this.profileService.removeFriendship(login)
			.subscribe(r => {if (r){
				this.friends = this.friends.filter(f => f.login != login)
				this.incomingFriendRequests = this.incomingFriendRequests.filter(l => l.login != login)
	 			}
			} )
	}

}
