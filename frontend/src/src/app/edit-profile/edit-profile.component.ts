import { Component, OnInit, } from '@angular/core'; 
import { FormBuilder } from '@angular/forms';
import { EditProfileService } from './edit-profile.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { User } from '../user';
import { UserProfileService } from '../user-profile/user-profile.service';
import { HttpHeaders, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UserRole } from '@shared/enum';
import { Location } from '@angular/common'
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
  selectedFile: File | null = null;
  formData = new FormData();


  editForm = this.editBuilder.group({
		firstName: '',
    lastName: '',
		nick: '',
		email: '',
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
    private activatedRoute: ActivatedRoute
	){
      // this.profileService.getUserDetails()
      //   .subscribe((response: User) => {
      //     this.user = response;
      //   });
  }

  sendEditedUser():void {
  	  console.log("sending")
    this.httpClient.post<any>(environment.apiUrl + '/edit-profile/user/edit', this.newUser)
    .subscribe(
    	(response: User) => {console.log(response)},

    	error => console.log(error))
		console.log(this.newUser);
    this.router.navigateByUrl(`/user-profile/${this.user?.login}`);

  }
  
  onSubmit(): void {
    this.newUser = this.user;
	if (!this.newUser) return;

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
          const id = token?.id;
  
          // Verificar si el usuario tiene un rol de administrador o si es el propio usuario conectado
          console.log("ID is: " + id);
          console.log("UserID is: " + this.user?.id);
          if (id !== null && (id === this.user?.id || this.user?.userRole == UserRole.ADMIN)) {
            console.log("Este usuario puede editar");
            this.editForm.controls['firstName'].setValue(this.user!.firstName);
            this.editForm.controls['lastName'].setValue(this.user!.lastName);
            this.editForm.controls['nick'].setValue(this.user!.nick);
            this.editForm.controls['email'].setValue(this.user!.email);
            // El usuario tiene permiso para editar el perfil
            // Agrega aquí cualquier lógica adicional que necesites para gestionar la edición.
          } else {
            // El usuario no tiene permiso para editar el perfil, redirige a la página anterior.
            console.log("Este usuario no puede editar");
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
}
