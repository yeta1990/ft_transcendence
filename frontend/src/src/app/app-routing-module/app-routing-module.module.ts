import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FormComponent } from '../form/form.component'
import { LoginComponent } from '../login/login.component';
import { CallbackComponent } from '../callback/callback.component';
import { ChatComponent } from '../chat/chat.component';
import { AuthGuardService as AuthGuard } from '../auth/auth-guard.service';
import { AllUsersComponent } from '../all-users/all-users.component'
import { UserProfileComponent } from '../user-profile/user-profile.component'
import { HomeComponent } from '../home/home.component';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';
import { PongComponent } from '../pong/pong.component';


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
	{	path: '',  component: HomeComponent, canActivate: [AuthGuard] },
	{	path: 'home',  component: HomeComponent, canActivate: [AuthGuard] },
	{	path: 'signup', component: FormComponent } ,
	{	
		path: 'chat', 
		component: ChatComponent, 
		canActivate: [AuthGuard] 
	},
	{	path: 'login', component: LoginComponent },
	{	path: 'callback', component: CallbackComponent },
	{	
		path: 'all-users', 
		component: AllUsersComponent, 
		canActivate: [AuthGuard] 
	},
	{	
		path: 'user-profile/:login', 
		component: UserProfileComponent, 
		canActivate: [AuthGuard] 
	},
	{
		path: 'user-profile/:login/edit',
		component: EditProfileComponent,
		canActivate: [AuthGuard],
		data: {
		  bothCheck: true
		},
	  },
	{
		path: 'play',
		component: PongComponent,
		canActivate: [AuthGuard] 
	}
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
