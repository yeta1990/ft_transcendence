import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';
import { SocketPayload } from '@shared/types'
import { events } from '@shared/const';
import { AuthGuardService } from '../../auth/auth-guard.service';
import { ChatService } from '../../chat/chat.service'
import { Subscription } from "rxjs"

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {

  @Input() public isUserLogged: boolean;

	private subscriptions = new Subscription();
   constructor(
       private authService: AuthService,
       private authGuardService: AuthGuardService,
       private router: Router,
       private chatService: ChatService

    ) {
      this.isUserLogged = authService.isLoggedIn();
	  this.chatService.forceInit()    
	  this.subscriptions.add(
		this.chatService
			.getMessage()
			.subscribe((payload: SocketPayload) => {
				if (payload.event === events.ActiveUsers){
					this.chatService.setActiveUsers(payload.data)
				}
		})
	  )
    }


  logout() {
    this.authService.logout();
  }

  hasAdminPrivileges(): boolean {
		return this.authGuardService.isAdminOrOwner()
  }

  redirectToMyProfile() {
    // Obtén el nombre de usuario del JWT
    const userName = this.authService.getUserNameFromToken();
    if (userName) {
      this.router.navigate(['/user-profile', userName]);
    } else {
	  this.router.navigateByUrl('/home');
    }
  }

  redirectToFriends() {
	this.router.navigateByUrl('/friends');
  }

  redirectToGame() {
      this.router.navigateByUrl('/play');
  }

  redirectToAdmin() {
      this.router.navigateByUrl('/admin');
  }

  redirectToChatAdmin() {
      this.router.navigateByUrl('/admin-chat');
  }

}
