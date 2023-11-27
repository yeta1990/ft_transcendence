import { Component } from '@angular/core';
import { AllUsersService } from '../all-users/all-users.service'
import { AuthService } from '../auth/auth.service'
import { ChatService } from '../chat/chat.service'
import {UserProfileService} from '../user-profile/user-profile.service'
import { Router } from '@angular/router';
import {User} from '../user'
import {ChatUser} from '@shared/types'
import {UserStatus} from '@shared/enum'
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent {

	public viewer:boolean = false;
	friends: User[] = []
	allUsers: User[] = []
	viewingTo: string = "";
	incomingFriendRequests: User[] = []
	myLogin: string;
    imagesBaseUrl: string = environment.apiUrl + '/uploads/'
	constructor(private usersService: AllUsersService, private authService: AuthService, private profileService: UserProfileService, private chatService: ChatService, private router: Router){
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
 
 	showGame(): boolean {
		if (this.getUserStatus(this.viewingTo) !== 3){
			this.viewer = false
			return false
		}
		return true;
 	}
	getActiveUsers(): Array<ChatUser> {
		return this.chatService.getActiveUsers()
	}

	getUserStatus(login: string): UserStatus {
		return this.chatService.getUserStatus(login)
	}

	getAvailableRoomsList(): Array<string>{
		return this.chatService.getAvailableRoomsList()
	}

	spectatorTo(room:string, login: string): void {
		if (room == "Isn't playing") return;
		this.viewingTo = login;
		this.viewer = true;
		console.log("view to --> " + room);
        this.chatService.setCurrentRoom(room);
		this.chatService.joinUserToRoomAsViwer(room);
	}

	getGameRoom(login: string): string {
		const availableRoomsList: Array<string> = this.getAvailableRoomsList()
//		console.log(availableRoomsList)
		for (let room of availableRoomsList){
			if (room.includes('pongRoom') && room.includes(login) && room.includes('+')){
				return room;
			}
		}
		return "Isn't playing"
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
