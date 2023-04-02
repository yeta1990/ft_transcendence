import { Body, Controller, Get, Post, HttpCode, HttpStatus, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { User } from '../user/user.entity';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	signIn(@Body() signInDto: User) {
		return this.authService.signIn(signInDto.nick, signInDto.email);
	}

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
}
