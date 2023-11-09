import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { User } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import { ConfigService } from '@nestjs/config';
import { toFileStream } from 'qrcode';
import { Response } from 'express';

@Injectable()
export class Auth2faService {
	constructor (
		private readonly userService: UserService,
		private readonly configService: ConfigService
	) {}

	public async generate2FASecret( userId: number ) {
		const secret = authenticator.generateSecret();
		const user = await this.userService.getUser(userId);
		if (user) {
			const otpauthURL = authenticator.keyuri( user.email, this.configService.get('FT_TRASCENDENCE'), secret);
	
			await this.userService.set2FASecret( secret, user.id );
	
			return {
				secret,
				otpauthURL
			}
		}
	}

	public async createQRCode( stream: Response, otpauthURL: string ) {
		return toFileStream( stream, otpauthURL );
	}

	public async is2fACodeValid( code2fa: string, userId: number ) {
		const user = await this.userService.getUser(userId);
		return authenticator.verify({
			token: code2fa,
			secret: user.mfaSecret
		})
	}
}

//https://wanago.io/2021/03/08/api-nestjs-two-factor-authentication/
//https://medium.com/@hemi_1337/authentication-and-authorization-in-angular-and-nestjs-with-oauth2-and-openid-connect-df1109042c07
