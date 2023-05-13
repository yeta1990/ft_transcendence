import { NgModule } from '@angular/core';
import { Routes, RouterModule, CanActivate } from '@angular/router';
import { MyProfileComponent } from '../my-profile/my-profile.component'
import { FormComponent } from '../form/form.component'
import { LoginComponent } from '../login/login.component';
import { CallbackComponent } from '../callback/callback.component';
import { AuthGuardService as AuthGuard } from '../auth-guard.service';

//routes are doubly protected:
// - the canActivate property runs the AuthGuard in the front and checks for a token that seems valid, but without checking the signature
// (as we are in client side, we can't expose the jwt encoding
// key)
// - so in case the user tries to 'hack' the token and changes
// the access token to add expiration time, por instance,
// the backend will be responsible for checking the signature
// and returning a 401 if the token has been manipulated
// - With an unauthorized error (401) response from the backend, 
// the user will be redirected to login page
const routes: Routes = [
	{	path: '', component: FormComponent } ,
	{	path: 'login', component: LoginComponent },
	{
		path: 'my-profile',
		canActivate: [AuthGuard],
		component: MyProfileComponent,
	},
	{	path: 'callback', component: CallbackComponent }
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
