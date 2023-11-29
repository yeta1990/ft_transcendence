// Angular Core Modules
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { Location } from '@angular/common'

// Angular Forms, HTTP, Router
import { switchMap } from 'rxjs/operators';

// Servicios Propios
import { TwoFactorAuthService } from './two-factor-auth-service/two-factor-auth-service.service';
import { AuthService } from '../auth/auth.service';
import { UserProfileService } from '../user-profile/user-profile.service';
import { ModalService } from '../modal/modal.service';
import { ToasterService } from '../toaster/toaster.service';
import { ValidationService } from './validation-service/validation-service.service';
import { ImageService } from './ImageService/image-service.service';

// Enums, Constantes o Tipos Compartidos
import { User } from '../user';
import { ToastValues } from '@shared/const';
import { Campuses, UserRole } from '@shared/enum';

// Librerías de Terceros
import { lastValueFrom, of, Subscription } from 'rxjs';


@Component({
	selector: 'app-edit-profile',
	templateUrl: './edit-profile.component.html',
	styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements  OnInit, OnDestroy {

	user: User | undefined;
	newUser: User | undefined;
	editingField: string | null = null;
	editedFields: { [key: string]: any } = {};
	showMfaModal = false;
	mfaActivated : boolean = false;
	tokenId: number = 0;
	selectedFile: File | null = null;
	campusesTypes = Object.keys(Campuses);
	formData = new FormData();
	isAdmin = false;
	editEnabled = false;
	loginEnabled = false;
	selectedStandardAvatar: string | null = null
	originalFormValues: any;
	errorMessage: string | undefined = undefined;
	imagesBaseUrl: string = environment.apiUrl + '/uploads/'
	public avatarImages: string[] = [];
	avatarImageSrc: string | null = null;

	private modalClosedSubscription: Subscription = new Subscription();

	editForm = this.editBuilder.group({
		login:'',
			firstName: '',
		lastName: '',
			nick: '',
			email: '',
			campus: new FormControl(this.campusesTypes[0]),
		mfa: false,
			file: ''
		});

	constructor(
		private editBuilder: FormBuilder,
		private router: Router,
		private authService: AuthService,
		private profileService: UserProfileService,
		private httpClient: HttpClient,
		private location: Location,
		private activatedRoute: ActivatedRoute,
		private modalService: ModalService,
		private toasterService: ToasterService,
		private readonly validationService: ValidationService,
		private twoFactorAuthService: TwoFactorAuthService,
		private imageService: ImageService,
		){
	}

	// CICLO DE VIDA DEL COMPONENTE --------------------------------------------

	ngOnInit(): void {
		this.activatedRoute.paramMap.pipe(
			switchMap(paramMap => {
			const login = paramMap.get('login');
			if (login !== null) {
				return this.profileService.getUserIDByLogin(login);
			}
			return of(null);
			})
		).subscribe((userId: number | null) => {
			if (userId !== null) {
			this.getUserProfileData(userId);
			} else {
			// this.router.navigate(['/error-page']);
			}
		});
		this.twoFactorAuthService.getMfaActivatedObservable().subscribe((mfaActivated: boolean) => {
			this.mfaActivated = mfaActivated;
		});
		this.imageService.getAvatarImages().subscribe(
			(images) => {
			  this.avatarImages = images;
			},
			(error) => {
			  console.error('Error fetching avatar images:', error);
			}
		  );
//		  this.imageService.selectedImage$.subscribe((selectedImage: File) => {
//			this.avatarImageSrc = this.imagesBaseUrl + URL.createObjectURL(selectedImage);
//			this.formData.append('image', this.avatarImageSrc )
//		  });
	}

	ngOnDestroy(): void {
		this.modalClosedSubscription.unsubscribe();
	}

	// FUNCIONES RELACIONADAS CON EL PERFIL DEL USUARIO  --------------------------------------------

	getUserProfileData(userId: number | null): void {
		if (userId !== null) {
		this.profileService.getUserProfile(userId).subscribe(
			(userProfile: User) => {
				this.user = userProfile;
				this.checkUserPermissions();
				this.configureUserForm();
				this.originalFormValues = { ...this.editForm.value };
			},
			(error: any) => {
				console.error('Error al obtener el perfil del usuario:', error);
				this.handleProfileError(error);
			}
		);
		} else {
			// this.router.navigate(['/error-page']);
		}
	}
	
	handleProfileError(error: any): void {
		let errorMessage = 'Se produjo un error al obtener el perfil del usuario.';
	
		if (error && error.status === 404) {
			errorMessage = 'El perfil del usuario no fue encontrado.';
		}
		this.toasterService.launchToaster(ToastValues.ERROR, errorMessage);
		// this.router.navigate(['/error-page']);
	}

	configureUserForm(): void {
		if (!this.user) return;

		this.editForm.patchValue({
			login: this.user.login,
			firstName: this.user.firstName,
			lastName: this.user.lastName,
			nick: this.user.nick || '',
			email: this.user.email,
		});
		
		const selectedCampus = this.user!.campus || '';
		const numberCampus = Object.values(Campuses).indexOf(selectedCampus);
		this.editForm.controls['campus'].setValue(this.campusesTypes[numberCampus]);

		this.editForm.get('nick')?.valueChanges.subscribe((newNick: string | null) => {
			if (newNick !== null) {
				this.validateNick(newNick);
			} else {
			}
		});
	}

	// FUNCIONES PARA LA VALIDACIÓN -------------------------------------------------------------

	subscribeToInputs() : void {
		this.editForm.get('firstName')?.valueChanges.subscribe((name: string | null) => {
			if (name !== null) {
				this.validateName(name);
			} else {
			}
		});
		this.editForm.get('nick')?.valueChanges.subscribe((newNick: string | null) => {
				console.log("validate nick")
			if (newNick !== null) {
				console.log("validate nick")
				this.validateNick(newNick);
			} else {
			}
		});
	}

	async validateNick(newNick: string | null): Promise<void> {
		console.log("val")
		if (newNick !== null) {
			const ret = await this.validationService.checkNick(newNick);
			if(newNick == this.user?.nick){
				this.errorMessage = undefined;
				this.editForm.get('nick')?.setErrors(null);
			}
			else if (ret.success) {
				this.errorMessage = undefined;
				this.editForm.get('nick')?.setErrors(null);
			} else {
				this.errorMessage = ret.message;
				this.editForm.get('nick')?.setErrors({ notAvailable: true });
			}
		}
	}

	validateName( name: string | null ) : void {
		if ( name !== null ) {
			const ret = this.validationService.checkName(name);
		}
	}

	checkUserPermissions(): void {
		const token = this.authService.getDecodedAccessToken(this.authService.getUserToken() ?? '');
		this.tokenId = token?.id;

		if (this.tokenId !== null && (this.tokenId === this.user?.id || this.user?.userRole == UserRole.ADMIN)) {
			if (this.user?.userRole == UserRole.ADMIN) {
				this.isAdmin = true;
			}
			this.mfaActivated = this.user?.mfa || false;
		} else {
			this.handleUnauthorizedUser();
		}
	}

	handleUnauthorizedUser(): void {
		const message: string = "Este usuario no puede editar";
		this.toasterService.launchToaster(ToastValues.ERROR, message);
		this.location.back();
		}

	// FUNCIONES RELACIONADAS CON LA EDICIÓN DEL PERFIL ----------------------------------

	editLogin() {
		if (this.isAdmin) {
			this.loginEnabled = true;
		}
	}

	editEmail() {
		if (this.user!.id === this.tokenId || this.isAdmin ) {
			this.editEnabled = true;
		}
	}

	sendEditedUser(): void {
	this.httpClient.post<any>(environment.apiUrl + '/edit-profile/user/edit', this.newUser)
		.subscribe(
		(response: User) => {
		},
		(error) => {
			console.error('Error al editar el usuario:', error);
			this.toasterService.launchToaster(ToastValues.ERROR, 'Error al editar el usuario');
		}
		);
		this.router.navigateByUrl(`/user-profile/${this.user?.login}`);
	}

	async saveChanges(): Promise<void> {
		this.newUser = this.user;
		if (!this.newUser) return;
	
		this.newUser.login = this.editForm.get('login')?.value!;
		this.newUser.firstName = this.editForm.get('firstName')?.value!;
		this.newUser.lastName = this.editForm.get('lastName')?.value!;
		this.newUser.nick = this.editForm.get('nick')?.value!;
		this.newUser.email = this.editForm.get('email')?.value!;

		if (this.formData.has('image')) {
			try {
				const uploadResponse = await this.uploadImage();
				if (uploadResponse && uploadResponse.image) {
				this.newUser.image = uploadResponse.image;
				}
				
			} catch (error) {
				console.error('Error al subir la imagen:', error);
			}
		}
		else if (this.selectedStandardAvatar){
			this.newUser.image = this.selectedStandardAvatar	
		}
		this.sendEditedUser();
	}

	discardChanges() {
		this.editForm.patchValue(this.originalFormValues);
		this.clearFile();
		this.avatarImageSrc = null;
	}

	async uploadImage(): Promise<any> {
		try {
			const response = await this.httpClient.post<any>(environment.apiUrl + '/user/upload', this.formData).toPromise();
			return response;
		} catch (error) {
			this.handleUploadError(error);
		}
	}

	handleUploadError(error: any): void {
		let errorMessage = 'Se produjo un error al cargar la imagen.';
	  
		if (error && error.error && error.error.error) {
		  errorMessage = error.error.error;
		} else if (error && error.error && error.error.message) {
		  errorMessage = error.error.message;
		}
	  
		this.toasterService.launchToaster(ToastValues.ERROR, 'Error al cargar imagen');
	  }


	clearFile(): void{
		this.editForm.get('file')?.setValue(null)
		const fileInput = document.getElementById('file') as HTMLInputElement
		if (fileInput){
			fileInput.value = ''
		}
		this.formData.delete('image')
	}

	async onFileInputClick(): Promise<void> {
		const images = await lastValueFrom(this.imageService.getAvatarImages());
		this.openImageModal(images);
	  }
	
	  openImageModal(images: string[]): void {
		const modalData = {
			images: images,
			onSelectImage: (selectedImage: string) => {
			},
		};
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
			if (confirm){
				const selectedImage = this.modalService.getImage()
				this.selectedStandardAvatar = this.modalService.getModalData()[0]

				if (selectedImage != undefined){
					let selectedImageOk = selectedImage;
					const _file = URL.createObjectURL(selectedImage);
					this.avatarImageSrc = _file 
					if (this.avatarImages.includes(_file)){
						this.avatarImageSrc = this.imagesBaseUrl + _file;
					}
					this.formData.append('image', selectedImageOk )
				}
				else if (this.selectedStandardAvatar){
					this.avatarImageSrc = this.imagesBaseUrl + this.selectedStandardAvatar
				}
			}
		})
		this.modalService.openModal('imageGalleryTemplate', modalData);
	  }

	getUserImage(): string{
		if (this.avatarImageSrc && this.avatarImageSrc.includes('blob') && this.avatarImageSrc.substr(0,4) != "http") return this.avatarImageSrc;
		if (this.avatarImageSrc && !this.avatarImageSrc.includes('blob')) return this.avatarImageSrc
		if (this.user?.image) return this.imagesBaseUrl + this.user?.image
		return this.imagesBaseUrl + 'phldr.jpg' 
	
	}

	// FUNCIONES RELACIONADAS CON 2FA ------------------------------------------------


	connectMfa(): void {
	this.twoFactorAuthService.generateQRCode(this.user?.id!).subscribe(
		(qrCodeBlob: Blob) => {
			const qrURL = URL.createObjectURL(qrCodeBlob);
			this.twoFactorAuthService.SubscribeTo2faInput(this.user?.id!, true);
			this.modalService.openModal('enableMfaTemplate', { qrURL });
		},
		(error) => {
			console.error('ERROR: Error al generar el código QR:', error);
		}
	)
	}

	disconnectMfa(): void {
		this.twoFactorAuthService.SubscribeTo2faInput(this.user?.id!, false);
		this.modalService.openModal('disableMfaTemplate');
	}
}
