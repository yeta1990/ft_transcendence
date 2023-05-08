import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { EditProfileService } from './edit-profile.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { User } from '../user';
import { MyProfileService } from '../my-profile/my-profile.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent {

  user: User | undefined;
  newUser: User | undefined;

  editForm = this.editBuilder.group({
		name: '',
    lastName: '',
		nick: '',
		email: ''
	});

  constructor(
		private editBuilder: FormBuilder,
		private editProfileService: EditProfileService,
		private router: Router,
		private authService: AuthService,
    private profileService: MyProfileService,
	){
      this.profileService.getUserDetails()
        .subscribe((response: User) => {
          this.user = response;
        });
  }

  onSubmit(): void {
    
    this.router.navigateByUrl('/my-profile');
  }
}
