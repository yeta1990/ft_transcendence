import { Body, Controller, Get, Post, HttpCode, HttpStatus, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { UserId } from '../user/user.decorator';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import { LoginBody } from './auth.interface'

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


}
