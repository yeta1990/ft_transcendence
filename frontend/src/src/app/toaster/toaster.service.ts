import { Injectable, EventEmitter } from '@angular/core';
import { ToastData } from '@shared/types';

@Injectable({
  providedIn: 'root'
})
export class ToasterService {
	toaster: EventEmitter<ToastData> = new EventEmitter<ToastData>()
}

