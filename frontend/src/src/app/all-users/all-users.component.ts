import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../user';
import { AllUsersService } from './all-users.service';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service'
import {ChatUser} from '@shared/types'
import {UserStatus} from '@shared/enum'
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-all-users',
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.css']
})
export class AllUsersComponent {

	users: User[] | undefined;
    imagesBaseUrl: string = environment.apiUrl + '/uploads/'

	constructor(
		private profileService: AllUsersService,
		private authService: AuthService,
		private router: Router,
		private chatService: ChatService
	){
		this.profileService.getUsers() 
			.subscribe((response: User[]) => { 
				this.users = response;
			});
	}
	getUserLogin(login: string): any {
		console.log("Login: " + login);
		this.router.navigateByUrl('/user-profile/' + login);
		return login;
	}

	getActiveUsers(): Array<ChatUser> {
		return this.chatService.getActiveUsers()
	}

	getUserStatus(login: string): UserStatus {
		return this.chatService.getUserStatus(login)
	}
}

