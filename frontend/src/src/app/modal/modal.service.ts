// modal.service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalStatus = false;
  private modalData: any;
  private currentModal: string = "";
  private inputValue: string = "";
  private modalCloseSubject: Subject<void> = new Subject<void>();

  constructor() {}

  modalClosed$: Observable<void> = this.modalCloseSubject.asObservable();

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
	this.modalCloseSubject.next();
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

  getInputvalue(): string {
 	return this.inputValue; 
  }
}

