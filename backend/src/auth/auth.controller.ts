import { Body, Controller, Get, Post, HttpCode, HttpStatus, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { UserId } from '../user/user.decorator';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import { isValidTOTP, generateUniqueRC, generateSecret } from './totp';

interface LoginBody{
	code: string;
}

@Controller('auth')
export class AuthController {
	constructor(
		private authService: AuthService,
		private jwtService: JwtService
	) {}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	login(@Body() body: LoginBody)
	{
		return this.authService.signIn(body.code);
	}
	/*
	signIn(@Body() signInDto: User) {
		return this.authService.signIn(signInDto.nick, signInDto.email);
	}
	*/

/*
 * El objeto Request "req" tiene un campo user que contiene el usuario autenticado. 
 * El AuthGuard utiliza el JwtService y el token JWT proporcionado en la
 * solicitud para verificar si el usuario es válido y, si es así, 
 * añade la información del usuario al objeto Request.
 */
	@UseGuards(AuthGuard) //restringimos el acceso a este endpoint si el usuario no tiene un token válido
	@Get('profile')
	getProfile(@Request() req) {
		return req.user;
	}

	@Post('2fa/enable')
	async enable2FA(@Body() user: User) {
		if (user.mfa) {
			return { message: '2FA is already enabled' };
		}
		
		const mfaSecret = await generateSecret(); 

		// Guarda el secreto 2FA en el usuario y marca 2FA como habilitado
		await this.authService.enable2FA(user.id, mfaSecret);
		// Genera los códigos de recuperación
		const recoveryCodes = await this.generateRecoveryCodes(user);
		return { message: '2FA enabled successfully', recoveryCodes };
	}


	@Post('2fa/disable')
	async disable2FA(@Body() user: User) {
		if (!user.mfa) {
			return { message: '2FA is not enabled for this user' };
		}
		// Deshabilita la autenticación de dos factores para el usuario actual
		try {
			await this.authService.disable2FA(user.id);
			return { message: '2FA has been DISABLED for this user' };
		  } catch (error) {
			return { message: 'Failed to disable 2FA' };
		  }
	}

	@Post('2fa/generate-recovery-codes')
	async generateRecoveryCodes(user: User) {
		if (!user.mfa) {
			return { message: '2FA is not enabled for this user' };
		}

		// Genera códigos de recuperación (códigos alfanuméricos únicos)
		const recoveryCodes = await generateUniqueRC(10);
		await this.authService.saveRecoveryCodes(user.id, recoveryCodes);

		return { recoveryCodes };
	}

	@Post('2fa/validate')
	async validate2FA(@Request() req, @Body() body) {
		const user = req.user;
		if (!user.mfa) {
			return { message: '2FA is not enabled for this user' };
		}
		
		const { token } = body;
		const secret = user.mfaSecret;

		if (isValidTOTP(token, secret)) {
			return { message: '2FA code is valid' };
		} else {
			return { message: 'Invalid 2FA code' };
		}
	}
}
