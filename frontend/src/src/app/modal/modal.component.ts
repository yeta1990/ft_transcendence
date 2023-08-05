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
  modalData: any;

  constructor(private modalService: ModalService) {
 	this.modalData = this.modalService.getModalData() 
  }

  closeModal(): void {
    this.modalService.closeModal();
  }

  saveAndCloseModal(): void {
    this.modalService.setModalData(this.inputValue);
    this.modalService.closeModalWithData();
	this.inputValue = "";
  }

  isModalOpen(): boolean {
    return this.modalService.isModalOpen();
  }

  getCurrentModal(): string {
    return this.modalService.getCurrentModal();
  }

  getModalData(): string {
 	return this.modalService.getModalData(); 
  }

  @HostListener('document:keydown.escape', ['$event']) // Escuchar el evento de tecla "Escape"
  onKeydownHandler(event: KeyboardEvent): void {
    if (this.modalService.isModalOpen()) {
      this.closeModal(); // Cerrar el modal si está abierto
    }
  }
}

