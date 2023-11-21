import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, Subscription, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ModalService } from '../../modal/modal.service';
import { ToasterService } from '../../toaster/toaster.service';
import { ToastValues } from '@shared/const';

@Injectable({
	providedIn: 'root'
})
export class TwoFactorAuthService {

	constructor(
		private httpClient: HttpClient,
		private modalService: ModalService,
		private toasterService: ToasterService,
		) { }

	private modalClosedSubscription: Subscription = new Subscription();
	private mfaActivatedSubject = new Subject<boolean>();

	getMfaActivatedObservable(): Observable<boolean> {
		return this.mfaActivatedSubject.asObservable();
	}

	disable2FA(Id: number, code2fa: string) {
		const userId = Id;
		const loginCode = code2fa;
		const message = 'Token to validate code';

		const body = { userId, loginCode, message };
		console.log(body);
		return this.httpClient.post(environment.apiUrl + '/2fa/turn-off', body, { responseType: 'text' })
			.pipe(
				tap(() => {
					this.mfaActivatedSubject.next(false);
				})
			);
	}

	enable2FA(Id: number, code2fa: string) {
		const userId = Id;
		const loginCode = code2fa;
		const message = 'Token to validate code';

		const body = { userId, loginCode, message };
		console.log(body);
		return this.httpClient.post(environment.apiUrl + '/2fa/turn-on', body, { responseType: 'text' })
			.pipe(
			tap(() => {
				this.mfaActivatedSubject.next(true);
			})
			);
	}

	generateQRCode(Id: number): Observable<Blob> {
		const userId = Id;
		const loginCode = 'None';
		const message = 'This is the request token';

		const body = { userId, loginCode, message };
		console.log(body);
		return this.httpClient.post(environment.apiUrl + '/2fa/generate', body, { responseType: 'blob' });
	}

	SubscribeTo2faInput(userId: number, enable: boolean) {
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
			const confirm: boolean = this.modalService.getConfirmationInput();
			if (confirm) {
				this.handleConfirmation(userId, enable);
			} else {
				console.log("El cierre del modal no está confirmado");
			}
		});
	}

	private handleConfirmation(userId: number, enable: boolean) {
		const receivedData = this.modalService.getModalData();
		const code = receivedData[0];
		const regex = /^\d{6}$/;

		if (regex.test(code)) {
			this.handleValidCode(userId, enable, code);
		} else {
			this.handleInvalidCode();
		}
	}

	private handleValidCode(userId: number, enable: boolean, code: string) {
		this.modalClosedSubscription.unsubscribe();

		const subscription = enable ? this.enable2FA(userId, code) : this.disable2FA(userId, code);
			subscription.subscribe(
			(response) => {
				this.toasterService.launchToaster(ToastValues.INFO, response);
			},
			(error) => {
				console.log(error);
				this.toasterService.launchToaster(ToastValues.ERROR, 'El código proporcionado no es correcto');
			}
		);
	}

	private handleInvalidCode() {
		this.modalClosedSubscription.unsubscribe();
		const message: string = "Error en la introducción del código. El código debe tener 6 dígitos.";
		this.toasterService.launchToaster(ToastValues.ERROR, message);
	}
}
