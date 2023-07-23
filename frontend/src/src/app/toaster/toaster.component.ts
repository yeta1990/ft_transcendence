import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToasterService }  from './toaster.service';
import { Subject, timer } from 'rxjs';
import {takeUntil, delay} from 'rxjs/operators';
import { ToastData } from '@shared/types';

@Component({
  selector: 'app-toaster',
  templateUrl: './toaster.component.html',
  styleUrls: ['./toaster.component.css']
})
export class ToasterComponent implements OnInit, OnDestroy{
	private ngUnsubscribe = new Subject(); // Subject para controlar la desubscripción

	constructor(private toasterService: ToasterService) {}

	toastData: ToastData = {status: false, type: "none", message: ""}

	ngOnInit() {
		
		this.toasterService.toggle.subscribe((toastData) => {
			this.toastData.status = toastData.status
			this.toastData.type = toastData.type
			this.toastData.message = toastData.message
			console.log(this.toastData.message)
			this.ngUnsubscribe.next(''); // Cancelar la ocultación anterior
			this.ngUnsubscribe.complete(); // Completar la suscripción anterior
			this.ngUnsubscribe = new Subject(); // Crear un nuevo Subject para la nueva ocultación
			timer(3000)
				.pipe(takeUntil(this.ngUnsubscribe))
				.subscribe(() => {
					this.hideToast();
				});
			})
	}
	ngOnDestroy(): void {
		this.ngUnsubscribe.next('');
		this.ngUnsubscribe.complete();
	}

	hideToast() {
		const toastData: ToastData = { status: false, type: "none", message: "hiding"};
		this.toasterService.toggle.emit(toastData)
	}

}
