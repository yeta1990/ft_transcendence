import { Injectable, EventEmitter } from '@angular/core';
import { ToastData } from '@shared/types';

@Injectable({
  providedIn: 'root'
})
export class ToasterService {
	toaster: EventEmitter<ToastData> = new EventEmitter<ToastData>()

	launchToaster(type: string, message: string){
		const toastData: ToastData = {status: true, type, message, id: -1}
		this.toaster.emit(toastData)
	}
}

