import { NgModule ,ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing-module/app-routing-module.module'
import { AppComponent } from './app.component';
import { FormComponent } from './form/form.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { LoginComponent } from './login/login.component';
import { CallbackComponent } from './callback/callback.component';
import { AllUsersComponent } from './all-users/all-users.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { HomeComponent } from './home/home.component';
import { LayoutModule } from './layout/layout.module';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { ErrorInterceptor } from './error-interception/error.interceptor';
import { GlobalErrorHandler } from './error-interception/global-error-handler.service';
import { interceptorProviders } from './app.interceptors';
import { ChatComponent } from './chat/chat.component';
import { environment } from '../environments/environment';
import { PongComponent } from './pong/pong.component';
import { ToasterComponent } from './toaster/toaster.component'
import { ToasterService } from './toaster/toaster.service';
import { ModalComponent } from './modal/modal.component'
import { ModalService } from './modal/modal.service'


@NgModule({
  declarations: [
    AppComponent,
    FormComponent,
    MyProfileComponent,
    LoginComponent,
    CallbackComponent,
    AllUsersComponent,
    UserProfileComponent,
    HomeComponent,
    EditProfileComponent,
    ChatComponent,
    PongComponent,
    ToasterComponent,
    ModalComponent

  ],
  imports: [
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    LayoutModule
  ],
  providers: [
	interceptorProviders,
	ToasterService,
	ModalService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
