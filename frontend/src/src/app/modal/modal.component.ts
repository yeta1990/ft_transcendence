// modal.component.ts
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ModalService } from './modal.service';
import { environment } from 'src/environments/environment';
import { ChangeDetectorRef } from '@angular/core';
import { ImageService } from '../edit-profile/ImageService/image-service.service'

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class ModalComponent {

	@ViewChild('imageToCrop', { static: false }) imageElement!: ElementRef;

  inputValue: string = "";
  inputValue2: string = "";
  checkboxInput: boolean = false;
  confirmationInput: boolean = false;
  modalData: any;
  imagesBaseUrl: string = environment.apiUrl + '/uploads/'
  selectedImage: File | null = null;
  selectedImageName: string | null = null;
  formData: FormData = new FormData();
  placeholder: string = "phldr.jpg";

  constructor(private modalService: ModalService,
	private imageService: ImageService) {
 	this.modalData = this.modalService.getModalData()
  }

  noButton(): void {
	this.inputValue = "no";
	this.inputValue2 = "";
	this.checkboxInput = false;
	this.confirmationInput = false;
    this.modalService.setModalData(this.inputValue, this.inputValue2, this.confirmationInput, null);
    this.modalService.closeModalWithData();
	this.inputValue = "";
	this.inputValue2 = "";
	this.checkboxInput = false;
	this.confirmationInput = false;

  }
  closeModal(): void {
	this.inputValue = "";
	this.inputValue2 = "";
	this.checkboxInput = false;
	this.confirmationInput = false;
	this.selectedImage = null;
    this.modalService.closeModal();
  }

  saveAndCloseModal(): void {
 	this.confirmationInput = true; 
	if (this.selectedImage) {
		this.imageService.selectImage(this.selectedImage);
	}
    this.modalService.setModalData(this.inputValue, this.inputValue2, this.confirmationInput, this.selectedImage);
    this.modalService.closeModalWithData();
	this.inputValue = "";
	this.inputValue2 = "";
	this.selectedImage = null;
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

  getImages(): string[] {
    const data = this.modalService.getModalData();
    return data[0].images;
  }

  onImageSelect(selectedImage: string): void {
	  this.inputValue = selectedImage;
      this.selectedImage = null;
  } 


  openFileInput(): void {
    const fileInput = document.getElementById('file');
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileChange(event: any): void {
    const files = event.target.files as FileList;

    if (files.length > 0) {
		this.selectedImage = files[0];
		this.inputValue = ""
		this.selectedImageName = URL.createObjectURL(this.selectedImage)
      this.resetInput();
    }
  }

  resetInput(){
    const input = document.getElementById('avatar-input-file') as HTMLInputElement;
    if(input){
      input.value = "";
    }
 }

  clearFile(): void {
    this.formData.delete('image');
	this.selectedImage = null;
  }
}

