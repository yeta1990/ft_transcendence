import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button/button.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {AuthInterceptor } from '../auth.interceptor';
import { AppComponent } from '../app.component';
import { AuthService } from '../auth.service';


@NgModule({
  declarations: [
    ButtonComponent,
    NavBarComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ButtonComponent,
    NavBarComponent
  ],
  providers: [
    {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true,
    },
    AuthService
    ],
    bootstrap: [AppComponent]

})
export class LayoutModule { }
