import { NgModule } from '@angular/core';
import { Routes, RouterModule, CanActivate } from '@angular/router';
import { MyProfileComponent } from '../my-profile/my-profile.component'
import { FormComponent } from '../form/form.component'
import { LoginComponent } from '../login/login.component';
import { AuthGuardService as AuthGuard } from '../auth-guard.service';

const routes: Routes = [
	{	path: '', component: FormComponent } ,
	{	
		path: 'my-profile', 
		component: MyProfileComponent, 
		canActivate: [AuthGuard] 
	},
	{	path: 'login', component: LoginComponent }
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
