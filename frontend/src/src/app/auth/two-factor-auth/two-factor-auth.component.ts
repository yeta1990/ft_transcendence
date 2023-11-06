import { Component, OnInit } from '@angular/core';
import * as QRCode from 'qrcode';
import { HttpClient } from '@angular/common/http';
import { TwoFAService } from './two-factor-auth.service'


@Component({
  selector: 'app-two-factor-auth',
  templateUrl: './two-factor-auth.component.html',
  styleUrls: ['./two-factor-auth.component.css']
})
export class TwoFactorAuthComponent implements OnInit {
  // Debes tener el secreto 2FA disponible en esta variable
  twoFactorSecret: any;

  qrCodeDataUrl: string = ''; //????????

  constructor(private TwoFAService: TwoFAService) { }

  ngOnInit(): void {
    //Recoge el secreto para poder usarlo
    this.getSecret();

    // Genera el código QR y obtén los datos URL ???????????????????
    QRCode.toDataURL(this.twoFactorSecret, (err, url) => {
      if (!err) {
        // Almacena la URL de datos del código QR
        this.qrCodeDataUrl = url;
      }
    });
  }

  getSecret(): void {
    this.TwoFAService.getSecret().subscribe(
      (data) => {
        this.twoFactorSecret = data;
      },
      (error) => {
        console.error('Error al obtener el secreto:', error);
      }
    );
  }

}
