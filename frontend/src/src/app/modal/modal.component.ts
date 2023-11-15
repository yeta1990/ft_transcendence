// modal.component.ts
import { Component, HostListener } from '@angular/core';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class ModalComponent {
  inputValue: string = "";
  inputValue2: string = "";
  checkboxInput: boolean = false;
  confirmationInput: boolean = false;
  modalData: any;

  constructor(private modalService: ModalService) {
 	this.modalData = this.modalService.getModalData() 
  }

  closeModal(): void {
	this.inputValue = "";
	this.inputValue2 = "";
	this.checkboxInput = false;
	this.confirmationInput = false;
    this.modalService.closeModal();
  }

  saveAndCloseModal(): void {
 	this.confirmationInput = true; 
    this.modalService.setModalData(this.inputValue, this.inputValue2, this.confirmationInput);
    this.modalService.closeModalWithData();
	this.inputValue = "";
	this.inputValue2 = "";
	this.checkboxInput = false;
	this.confirmationInput = false;
  }

  confirmationButton(): void {
 	this.confirmationInput = true; 
	this.saveAndCloseModal();
  }

  isModalOpen(): boolean {
    return this.modalService.isModalOpen();
  }

  getCurrentModal(): string {
    return this.modalService.getCurrentModal();
  }

  getModalData(): Array<any> {
 	return this.modalService.getModalData(); 
  }

  getConfirmationInput(): boolean {
  	  return this.modalService.getConfirmationInput();
  }

  getQrCodeUrl(): string {
    const data = this.modalService.getModalData();
    if (data.length > 0) {
      const imgUrl = data[0];
      return imgUrl.qrURL;
    }
    return ''; // o alguna URL predeterminada o manejo de errores
  }


  @HostListener('document:keydown.escape', ['$event']) 
  onKeydownHandler(event: KeyboardEvent): void {
    if (this.modalService.isModalOpen()) {
      this.closeModal(); 
    }
  }
}

