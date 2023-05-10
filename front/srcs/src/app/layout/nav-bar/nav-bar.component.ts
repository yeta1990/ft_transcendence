import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/auth.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {

  @Input() public isUserLogged: boolean;
   constructor(
       private authservice: AuthService
    ) {
      this.isUserLogged = authservice.isLoggedIn();
    }
  logout() {
    this.authservice.logout();
  }
}
