import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {

  @Input() public isUserLogged: boolean;

   constructor(
       private authService: AuthService,
       private router: Router
    ) {
      this.isUserLogged = authService.isLoggedIn();
    }


  logout() {
    this.authService.logout();
  }

  redirectToMyProfile() {
    // Obtén el nombre de usuario del JWT
    const userName = this.authService.getUserNameFromToken();
    if (userName) {
      console.log(userName);
      this.router.navigate(['/user-profile', userName]);
    } else {
      console.error('No se pudo obtener el nombre de usuario del JWT.');
    }
  }
}
