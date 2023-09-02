import { Component, OnInit, } from '@angular/core'; 
import { FormBuilder } from '@angular/forms';
import { EditProfileService } from './edit-profile.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { User } from '../user';
import { MyProfileService } from '../my-profile/my-profile.service';
import { HttpHeaders, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements  OnInit {

  user: User | undefined;
  newUser: User | undefined;

  editForm = this.editBuilder.group({
		firstName: '',
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
    private httpClient: HttpClient
	){
      // this.profileService.getUserDetails()
      //   .subscribe((response: User) => {
      //     this.user = response;
      //   });
  }

  onSubmit(): void {
    this.newUser = this.user;
    if (this.newUser) {
      this.newUser.firstName = this.editForm.get('firstName')?.value!;
      this.newUser.lastName = this.editForm.get('lastName')?.value!;
      this.newUser.nick = this.editForm.get('nick')?.value!;
      this.newUser.email = this.editForm.get('email')?.value!;
    }
    this.httpClient.post<User>(environment.apiUrl + '/edit-profile/user/edit', this.newUser)
    .subscribe((response: User) =>console.log(response))
    console.log(this.newUser);
    this.router.navigateByUrl('/my-profile');
  }

  async ngOnInit(): Promise<void> {
    await this.profileService.getUserDetails()
        .subscribe((response: User) => { 
          this.user = response;
          this.editForm.controls['firstName'].setValue(this.user!.firstName);
          this.editForm.controls['lastName'].setValue(this.user!.lastName);
          this.editForm.controls['nick'].setValue(this.user!.nick);
          this.editForm.controls['email'].setValue(this.user!.email);
        });
  }
}
