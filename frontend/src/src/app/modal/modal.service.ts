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
  private inputValue: string = "";
  private inputValue2: string = "";
  private modalCloseSubject: Subject<void> = new Subject<void>();

  constructor() {}

  modalClosed$: Observable<void> = this.modalCloseSubject.asObservable();

  isModalOpen(): boolean {
    return this.modalStatus;
  }

  openModal(templateId: string, data?: any): void {
    this.currentModal = templateId;
    this.modalData1 = data;
    this.modalStatus = true;
  }
  closeModal(): void {
    this.modalStatus = false;
  }

  closeModalWithData(): void {
    this.modalStatus = false;
	this.modalCloseSubject.next();
  }

  setModalData(data1: any, data2: any): void {
    this.modalData1 = data1;
    this.modalData2 = data2;
  }

  getModalData(): any {
    return [this.modalData1, this.modalData2];
  }

  getCurrentModal(): string {
    return this.currentModal;
  }

  getInputvalue(): string {
 	return this.inputValue; 
  }

  getInput2value(): string {
 	return this.inputValue; 
  }

  resetModalInput(): void {
 	this.inputValue = ""; 
 	this.inputValue2 = ""; 
  }
}

