import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing-module/app-routing-module.module'
import { AppComponent } from './app.component';
import { FormComponent } from './form/form.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { LoginComponent } from './login/login.component';
import {AuthInterceptor } from './auth.interceptor';
import { CallbackComponent } from './callback/callback.component';
import { ErrorInterceptor } from './error-interception/error.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    FormComponent,
    MyProfileComponent,
    LoginComponent,
    CallbackComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [
  {
	provide: HTTP_INTERCEPTORS,
	useClass: AuthInterceptor,
	multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
