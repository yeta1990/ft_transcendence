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

  private modalClosedSubscription: Subscription = {} as Subscription;

  editForm = this.editBuilder.group({
		firstName: '',
    lastName: '',
		nick: '',
		email: '',
    mfa: false,
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
    private toasterService: ToasterService
	){
      // this.profileService.getUserDetails()
      //   .subscribe((response: User) => {
      //     this.user = response;
      //   });
  }

  async onSubmit(): Promise<void> {
    this.newUser = this.user;
  
    if (this.newUser) {
      this.newUser.firstName = this.editForm.get('firstName')?.value!;
      this.newUser.lastName = this.editForm.get('lastName')?.value!;
      this.newUser.nick = this.editForm.get('nick')?.value!;
      this.newUser.email = this.editForm.get('email')?.value!;
  
      // Realiza el envío del formulario después de verificar el MFA
      this.httpClient.post<User>(environment.apiUrl + '/edit-profile/user/edit', this.newUser)
        .subscribe((response: User) => {
          console.log(response);
          this.router.navigateByUrl('/user-profile/' + this.newUser?.login);
        });
    }
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
          const id = token?.id;
  
          // Verificar si el usuario tiene un rol de administrador o si es el propio usuario conectado
          if (id !== null && (id === this.user?.id || this.user?.userRole == UserRole.ADMIN)) {
            this.editForm.controls['firstName'].setValue(this.user!.firstName);
            this.editForm.controls['lastName'].setValue(this.user!.lastName);
            this.editForm.controls['nick'].setValue(this.user!.nick);
            this.editForm.controls['email'].setValue(this.user!.email);
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

  editProfile() {
		
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
