// modal.component.ts
import { Component } from '@angular/core';
import { ModalService } from './modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class ModalComponent {
  inputValue: string = "";
  textInput: string = "";

  constructor(private modalService: ModalService) {}

  openModal(templateId: string): void {
    this.modalService.openModal(templateId);
  }

  closeModal(): void {
    this.modalService.closeModal();
  }

  submitAndClose(): void {
    this.modalService.setModalData(this.textInput);
    this.modalService.closeModal();
  }

  saveAndCloseModal(): void {
    this.modalService.setModalData(this.inputValue);
    this.modalService.closeModal();
  }

  isModalOpen(): boolean {
    return this.modalService.isModalOpen();
  }

  getCurrentModal(): string {
    return this.modalService.getCurrentModal();
  }
}

