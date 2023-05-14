import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing-module/app-routing-module.module'

import { AppComponent } from './app.component';
import { FormComponent } from './form/form.component';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { LoginComponent } from './login/login.component';
import { CallbackComponent } from './callback/callback.component';
import { interceptorProviders } from './app.interceptors';
import { ChatComponent } from './chat/chat.component';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

import { environment } from '../environments/environment'

const socketConfig: SocketIoConfig = { url: environment.apiUrl, options: {} };

@NgModule({
  declarations: [
    AppComponent,
    FormComponent,
    MyProfileComponent,
    LoginComponent,
    CallbackComponent,
    ChatComponent
  ],
  imports: [
    FormsModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    SocketIoModule.forRoot(socketConfig)
  ],
  providers: [
	interceptorProviders
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
