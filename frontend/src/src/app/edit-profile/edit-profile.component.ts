import { Component, OnInit, } from '@angular/core'; 
import { FormBuilder, FormControl } from '@angular/forms';
import { EditProfileService } from './edit-profile.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { User } from '../user';
import { UserProfileService } from '../user-profile/user-profile.service';
import { HttpHeaders, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UserRole } from '@shared/enum';
import { ToastValues } from '@shared/const';
import { Location } from '@angular/common'
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { ModalService } from '../modal/modal.service';
import { Subscription } from "rxjs"
import { ToasterService } from '../toaster/toaster.service';
import { ValidationService } from './validation-service/validation-service.service';
import { Campuses } from '@shared/enum';


@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements  OnInit {

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

  private modalClosedSubscription: Subscription = {} as Subscription;

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
		private editProfileService: EditProfileService,
		private router: Router,
		private authService: AuthService,
    private profileService: UserProfileService,
    private httpClient: HttpClient,
    private location: Location,
    private activatedRoute: ActivatedRoute,
    private modalService: ModalService,
    private toasterService: ToasterService,
    private readonly validationService: ValidationService,
	){
  }

  sendEditedUser():void {
    this.httpClient.post<any>(environment.apiUrl + '/edit-profile/user/edit', this.newUser)
    .subscribe(
    	(response: User) => {console.log(response)},

    	error => console.log(error))
		console.log(this.newUser);
    this.router.navigateByUrl(`/user-profile/${this.user?.login}`);

  }
  
  async onSubmit(): Promise<void> {
    this.newUser = this.user;
	if (!this.newUser) return;

    this.newUser.login = this.editForm.get('login')?.value!;
    this.newUser.firstName = this.editForm.get('firstName')?.value!;
    this.newUser.lastName = this.editForm.get('lastName')?.value!;
    this.newUser.nick = this.editForm.get('nick')?.value!;
    this.newUser.email = this.editForm.get('email')?.value!;

	//in case of new image: first save image, get image name and then change the
	//value in newUser.image
	if (this.formData.has('image')){
    	this.httpClient.post<any>(environment.apiUrl + '/user/upload', this.formData)
    		.subscribe(response => {
    			
    			this.newUser!.image = response.image

    			console.log(this.newUser)
    			console.log("save user")
    			this.sendEditedUser()
    		},
    		error => console.log(error))
    }
    //otherwise, send the payload as it's
    else {
    	this.sendEditedUser()
    }
	

  }
  

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.editForm.patchValue({ file });
      this.formData.append('image', file)
    }
  }

  clearFile(): void{
  	  this.editForm.get('file')?.setValue(null)
  	  const fileInput = document.getElementById('file') as HTMLInputElement
  	  if (fileInput){
  	  	  fileInput.value = ''
  	  }
	 this.formData.delete('image')
  }

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
        forkJoin([
          this.profileService.getUserProfile(userId)
        ]).subscribe(([userProfile]: [User]) => {
          console.log("User ID dentro dentro es: " + userId);
          this.user = userProfile;
          
          // Obtener el ID del usuario desde el token JWT
          const token = this.authService.getDecodedAccessToken(this.authService.getUserToken() ?? '');
          this.tokenId = token?.id;
  
          // Verificar si el usuario tiene un rol de administrador o si es el propio usuario conectado
          if (this.tokenId !== null && (this.tokenId === this.user?.id || this.user?.userRole == UserRole.ADMIN)) {
			if (this.user?.userRole == UserRole.ADMIN) {
				this.isAdmin = true;
			}
			this.editForm.controls['login'].setValue(this.user!.login);
            this.editForm.controls['firstName'].setValue(this.user!.firstName);
            this.editForm.controls['lastName'].setValue(this.user!.lastName);
			this.editForm.controls['nick'].setValue(this.user!.nick);
            this.editForm.get('nick')?.valueChanges.subscribe(() => {
              const newNick = this.editForm.get('nick')?.value!;
              this.validateNick(newNick);
            });
            this.editForm.controls['email'].patchValue(this.user!.email);
			this.editForm.controls['campus'].setValue(this.user!.campus);
            this.mfaActivated = this.user?.mfa || false;
          } else {
            // El usuario no tiene permiso para editar el perfil, redirige a la página anterior.
            const message : string = "Este usuario no puede editar";
            this.toasterService.launchToaster(ToastValues.ERROR, message);
            this.location.back();
          }
        });
      } else {
        // Maneja el caso en el que no se obtuvo un userId, por ejemplo, redirigiendo o mostrando un mensaje de error.
      }
    });
  }

  validateNick(newNick: string | null): void {
    if (newNick !== null) {
      this.validationService.checkNickAvailability({ nick: newNick }).subscribe(
        (response) => {
			if (response == true || newNick === this.user?.nick) {
				this.editForm.get('nick')?.setErrors(null);
			} else {
				this.editForm.get('nick')?.setErrors({ notAvailable: true });
			}
        },
        (error) => {
          console.error('Error al verificar el nick:', error);
        }
      );
      }
    }

  editLogin() {
	if (this.isAdmin) {
        this.loginEnabled = true;
    }
  }

  editEmail() {
	if (this.user!.id === this.tokenId ) {
        this.editEnabled = true;
    }
  }

  	
    saveField(fieldName: string): void {
      // Aquí debes implementar la lógica para guardar los cambios en el backend
      console.log(`Guardando campo ${fieldName}: ${this.editedFields[fieldName]}`);
      this.cancelEdit();
	  }
	
	  cancelEdit() {
      this.editingField = null;
      this.editedFields = {};
	  }

    connectMfa(): void {
      this.generateQRCode(this.user?.id!).subscribe(
        (qrCodeBlob: Blob) => {
          const qrURL = URL.createObjectURL(qrCodeBlob);
          this.SubscribeTo2faInput(this.user?.id!, true);
          this.modalService.openModal('enableMfaTemplate', { qrURL });
        },
        (error) => {
          console.error('ERROR: Error al generar el código QR:', error);
        }
      )
    }

    disconnectMfa(): void {
      this.SubscribeTo2faInput(this.user?.id!, false);
      this.modalService.openModal('disableMfaTemplate');
    }

    disable2FA(Id: number, code2fa: string) {
      const userId = Id;
      const loginCode = code2fa;
      const message = 'Token to validate code';

      const body = { userId, loginCode, message };

      console.log(body);
      return this.httpClient.post(environment.apiUrl + '/2fa/turn-off', body, { responseType: 'text' })
        .pipe(
          tap(() => {
            this.mfaActivated = false;
        })
      );
    }

    enable2FA(Id: number, code2fa: string) {
      const userId = Id;
      const loginCode = code2fa;
      const message = 'Token to validate code';

      const body = { userId, loginCode, message };

      console.log(body);
      return this.httpClient.post(environment.apiUrl + '/2fa/turn-on', body, { responseType: 'text' })
        .pipe(
          tap(() => {
            this.mfaActivated = true;
        })
      );
    }

    generateQRCode(Id: number): Observable<Blob> {
      const userId = Id;
      const loginCode = 'None';
      const message = 'This is the request token';

      const body = { userId, loginCode, message };

      console.log(body);
      return this.httpClient.post(environment.apiUrl + '/2fa/generate', body, { responseType: 'blob' });
    }

    SubscribeTo2faInput(userId: number, enable: boolean) {
      let code = '';
      this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
        const confirm: boolean = this.modalService.getConfirmationInput();
        if (confirm){
          const receivedData = this.modalService.getModalData();
          code = receivedData[0];
          const regex = /^\d{6}$/;
          if (regex.test(code)) {
            if (enable) {
              this.modalClosedSubscription.unsubscribe();
              this.enable2FA(userId, code).subscribe(
                response => {
                  this.toasterService.launchToaster(ToastValues.INFO, response);
                },
                error => {
					this.toasterService.launchToaster(ToastValues.ERROR, 'El código proporcionado no es correcto');
                }
              );
            } else {
              this.modalClosedSubscription.unsubscribe();
              this.disable2FA(userId, code).subscribe(
                response => {
                  this.toasterService.launchToaster(ToastValues.INFO, response);
                },
                error => {
					this.toasterService.launchToaster(ToastValues.ERROR, 'El código proporcionado no es correcto');
                }
              );
            }
            
          } else {
            this.modalClosedSubscription.unsubscribe();
            const message : string = "Error en la introducción del código. El código debe tener 6 dígitos."
            this.toasterService.launchToaster(ToastValues.ERROR, message);
          }
        } else {
          console.log("El cierre del modal no está confirmado");
        }
    
    });
    }
}
