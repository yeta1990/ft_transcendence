import { Component, OnInit } from '@angular/core';
import { ToasterService }  from './toaster.service';

@Component({
  selector: 'app-toaster',
  templateUrl: './toaster.component.html',
  styleUrls: ['./toaster.component.css']
})
export class ToasterComponent implements OnInit{

	constructor(private toasterService: ToasterService) {}

	isToastVisible: boolean = false;

	ngOnInit() {
		this.toasterService.toggle.subscribe(isToastVisible => this.isToastVisible = isToastVisible)
	}

	hideToast() {
		this.toasterService.toggle.emit(false)
	}

}
