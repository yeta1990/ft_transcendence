// modal.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalStatus = false;
  private modalData: any;
  private currentModal: string = "";

  constructor() {}

  isModalOpen(): boolean {
    return this.modalStatus;
  }

  openModal(templateId: string, data?: any): void {
    this.currentModal = templateId;
    this.modalData = data;
    this.modalStatus = true;
  }

  closeModal(): void {
    this.modalStatus = false;
  }

  setModalData(data: any): void {
    this.modalData = data;
  }

  getModalData(): any {
    return this.modalData;
  }

  getCurrentModal(): string {
    return this.currentModal;
  }
}

