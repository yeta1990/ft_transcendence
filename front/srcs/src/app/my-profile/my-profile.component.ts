import { Component, OnInit } from '@angular/core';
import { User } from '../user';
import { MyProfileService } from './my-profile.service';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css']
})
export class MyProfileComponent implements OnInit {

	user: User | undefined;

	//why subscribe? https://stackoverflow.com/questions/68006823/angular-11-type-observableobject-is-missing-the-following-properties-from-ty
	constructor(private profileService: MyProfileService){
		this.profileService.getUserDetails() //this returns an Observable<User>, not a <User>
			.subscribe((response: User) => { //so subscribe waits for the async call to the backend
				this.user = response;
			});
	}

	ngOnInit(): void {	

	}
}
