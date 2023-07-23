import { Injectable, EventEmitter } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToasterService {
	toggle : EventEmitter<boolean> = new EventEmitter<boolean>()
}

