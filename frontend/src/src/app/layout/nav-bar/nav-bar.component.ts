import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';
import { AuthGuardService } from '../../auth/auth-guard.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {

  @Input() public isUserLogged: boolean;

   constructor(
       private authService: AuthService,
       private authGuardService: AuthGuardService,
       private router: Router
    ) {
      this.isUserLogged = authService.isLoggedIn();
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
