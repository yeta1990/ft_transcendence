import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ModalService } from '../modal/modal.service';
import { Subscription } from 'rxjs';
import { ToasterService } from '../toaster/toaster.service';
import { ToastValues } from '@shared/const';
import { UserProfileService} from '../user-profile/user-profile.service'

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
		private modalService: ModalService,
		private toasterService: ToasterService,
		private userProfileService: UserProfileService
	) {}

	code: string = '';
	private modalClosedSubscription: Subscription = {} as Subscription;

	ngOnInit() {
		this.route.queryParams.subscribe(params => {
			this.code = params['code'];
			this.authenticate(this.code);
//            this.router.navigateByUrl('/my-profile');
		});
	}

	authenticate(code: string) {
		if (code && this.validateCode(code)) {
			this.authService.login(code)
			.subscribe(
				(response) => {
					if (response.requiresMFA) {
						this.SubscribeTo2faInput(response.userId); 
						this.modalService.openModal('verifyMfaTemplate');
					} else {
						console.log("User is logged in");
						const login: any = this.authService.getUserNameFromToken()
						this.userProfileService
							.isMyFirstLogin(login)
							.subscribe(firstLogin => {
								if (firstLogin)
									{this.router.navigateByUrl('/user-profile/'+ login +'/edit');
									}else{
								this.router.navigateByUrl('/home');
									}

							},
							(error) => {this.router.navigateByUrl('/login')}
							)

					}
				}
			);
		} else {
			console.error("El código recibido no es un hash SHA-256 válido.");
		}
	}

	SubscribeTo2faInput(Id:number) {
		let code = '';
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
		  const confirm: boolean = this.modalService.getConfirmationInput();
		  if (confirm){
			const receivedData = this.modalService.getModalData();
			code = receivedData[0];
			const regex = /^\d{6}$/;
			if (regex.test(code)) {
				this.modalClosedSubscription.unsubscribe();
				this.authService.validateMfa(Id, code).subscribe(
					success => {
						if (!success) {
						const message : string = "El código facilitado no es válido."
						this.toasterService.launchToaster(ToastValues.ERROR, message);
						}
					},
					(error) => {
						console.error('HTTP Error:', error);
						this.toasterService.launchToaster(ToastValues.ERROR, error);
					});
			} else {
			  this.modalClosedSubscription.unsubscribe();
			  const message : string = "Error en la introducción del código. El código debe tener 6 dígitos."
			  this.toasterService.launchToaster(ToastValues.ERROR, message);
			}
		  } else {
			console.log("El cierre del modal no está confirmado");
			this.router.navigateByUrl('/login')
		  }
	  
	  });
	  }

	validateCode(code: string): boolean {
		return /^[a-fA-F0-9]{64}$/.test(code);
	}
}
