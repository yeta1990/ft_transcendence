import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { UserService } from '../../user/user.service';
import { ConfigService } from '@nestjs/config';
import { toFileStream } from 'qrcode';
import { Response } from 'express';
import { Validator } from '@shared/validation';

@Injectable()
export class Auth2faService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  public async generate2FASecret(userId: number) {
    const user = await this.userService.getUser(userId);
    if (user) {
      if (user.mfa == false) {
        const secret = authenticator.generateSecret();
        const otpauthURL = authenticator.keyuri(
          user.email,
          'ft_trascendence',
          secret,
        );
        await this.userService.set2FASecret(secret, user.id);

        return {
          secret,
          otpauthURL,
        };
      } else {
        return {
          message: 'QR already generated',
        };
      }
    }
  }

  public async createQRCode(stream: Response, otpauthURL: string) {
    return toFileStream(stream, otpauthURL);
  }

  public async is2fACodeValid(code2fa: string, userId: number) {
    console.log('He entrado en la verificación');
    if (Validator.isValid2faCode(code2fa)) {
      {
        console.log('He verificado que el código cumple con el regex');
        const user = await this.userService.getUser(userId);
        if (user) {
          console.log('Voy a verificar el código: ' + code2fa);
          try {
            const isValid = await authenticator.verify({
              token: code2fa,
              secret: user.mfaSecret,
            });
            return isValid;
          } catch (error) {
            console.error('Error al verificar el código:', error);
            return false;
          }
        }
      }
      console.log('El codigo no cumple con el regex');
      return false;
    }
  }
}
