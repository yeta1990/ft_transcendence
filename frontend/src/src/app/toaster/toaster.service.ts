import { Injectable, EventEmitter } from '@angular/core';
import { ToastData } from '@shared/types';

@Injectable({
  providedIn: 'root'
})
export class ToasterService {
	toggle : EventEmitter<ToastData> = new EventEmitter<ToastData>()
}

