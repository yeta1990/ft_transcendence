import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {

  @Input() dir: string = '';
  @Input() value: string = '';
  @Input() clss: string = '';

  constructor(
    private authService: AuthService,
		private router: Router
	){}
   goTo(): void{
    console.log("Go to: " + this.dir);
		this.router.navigateByUrl(this.dir);
  }
  logout(): void {
		console.log("log out");
		this.authService.logout();
		this.router.navigateByUrl('/login');
	}
}
