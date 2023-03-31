import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyProfileComponent } from '../my-profile/my-profile.component'
import { FormComponent } from '../form/form.component'
const routes: Routes = [
	{	path: '', component: FormComponent } ,
	{	path: 'my-profile', component: MyProfileComponent  }
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
