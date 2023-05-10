import { Component, Input } from '@angular/core';
import { LoginComponent } from 'src/app/login/login.component';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {

  @Input() public isUserLogged: boolean;
   constructor(
       private log: LoginComponent
   ){
    this.isUserLogged = log.isUserLoggedIn;
    console.log(this.isUserLogged);
  }
}
