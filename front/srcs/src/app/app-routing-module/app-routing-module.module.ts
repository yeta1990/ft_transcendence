import { NgModule } from '@angular/core';
import { Routes, RouterModule, CanActivate } from '@angular/router';
import { MyProfileComponent } from '../my-profile/my-profile.component'
import { FormComponent } from '../form/form.component'
import { LoginComponent } from '../login/login.component';
import { CallbackComponent } from '../callback/callback.component';
import { AuthGuardService as AuthGuard } from '../auth-guard.service';
import { AllUsersComponent } from '../all-users/all-users.component'
import { UserProfileComponent } from '../user-profile/user-profile.component'
import { HomeComponent } from '../home/home.component';


const routes: Routes = [
	{	path: '',  component: HomeComponent},
	{	path: 'form', component: FormComponent } ,
	{	
		path: 'my-profile', 
		component: MyProfileComponent, 
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
		path: 'user-profile/:id', 
		component: UserProfileComponent, 
		canActivate: [AuthGuard] 
	}
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
