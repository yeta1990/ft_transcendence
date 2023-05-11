import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.css']
})

export class CallbackComponent implements OnInit {
	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private authService: AuthService,
	) {}

	code: string = '';
	ngOnInit() {
		this.route.queryParams.subscribe(params => {
			this.code = params['code'];
			this.getToken(this.code);
//            this.router.navigateByUrl('/my-profile');
		});
		
	}
	getToken(code: string) {
        if (code) {
            this.authService.login(code)
                .subscribe(
                    () => {
                        console.log("User is logged in");
                        this.router.navigateByUrl('/my-profile');
                    }
                );
        }
//		this.callbackService.getToken(this.code);
	}

}
