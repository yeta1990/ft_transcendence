// modal.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalStatus = false;
  private modalData1: any;
  private modalData2: any;
  private currentModal: string = "";
  private confirmationInput: boolean = false;
  private modalCloseSubject: Subject<void> = new Subject<void>();

  constructor() {}

  modalClosed$: Observable<void> = this.modalCloseSubject.asObservable();

  isModalOpen(): boolean {
    return this.modalStatus;
  }

  openModal(templateId: string, data?: any): void {
    this.confirmationInput = false;
    this.currentModal = templateId;
    this.modalData1 = data;
    this.modalStatus = true;
  }
  closeModal(): void {
    this.modalStatus = false;
    this.confirmationInput = false;
    this.modalData1 = "";
    this.modalData2 = "";
	this.modalCloseSubject.next();
  }

  closeModalWithData(): void {
    this.modalStatus = false;
	this.modalCloseSubject.next();
  }

  setModalData(data1: any, data2: any, data3: boolean): void {
    this.modalData1 = data1;
    this.modalData2 = data2;
	this.confirmationInput = data3;
  }

  getModalData(): Array<string>{
    return [this.modalData1, this.modalData2];
  }

  getConfirmationInput(): boolean {
  	  return this.confirmationInput;
  }

  getCurrentModal(): string {
    return this.currentModal;
  }
}

