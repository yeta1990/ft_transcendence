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
  selectedImage: string | null = null;
  formData: FormData = new FormData();
  file: string | null = null;
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
    this.modalService.setModalData(this.inputValue, this.inputValue2, this.confirmationInput);
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
	if (this.selectedImage) {
		this.imageService.selectImage(this.selectedImage);
	}
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
    console.log('Modal: Imagen seleccionada:', selectedImage);
    if (this.selectedImage === selectedImage) {
      this.selectedImage = null;
    } else {
      this.selectedImage = selectedImage;
    }
  } 

  isImageSelected(image: string): boolean {
    return this.selectedImage === image;
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
      const _file = URL.createObjectURL(files[0]);
      console.log('_file:', _file);
		this.file = _file;
		this.selectedImage = this.file;
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
	this.file = null;
  }
}

