import { NgModule ,ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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
import { PaddleComponent } from './pong/paddle/paddle.component';
import { EntityComponent } from './pong/entity/entity.component';
import { RoomComponent } from './pong/room/room.component'


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
    PaddleComponent,
    EntityComponent,
    RoomComponent

  ],
  imports: [
    FormsModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    LayoutModule
  ],
  providers: [
	interceptorProviders,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
