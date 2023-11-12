import {
	ClassSerializerInterceptor,
	Controller,
	Header,
	Post,
	UseInterceptors,
	Res,
	UseGuards,
	Req,
	HttpCode,
	HttpStatus,
	Body,
	UnauthorizedException,
  } from '@nestjs/common';
import { Auth2faService } from './auth2fa.service';
import { response, Response } from 'express';
import { AuthGuard } from '../auth.guard';
import { RequestWithUser } from '../auth.interface';
import { CodeDto2fa } from './auth2fa.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from '../auth.service';

@Controller('2fa')
@UseInterceptors( ClassSerializerInterceptor )
export class Auth2faController {
	constructor(
		private readonly auth2faService: Auth2faService,
		private readonly userService: UserService,
		private readonly authService: AuthService,
	) {}

		

	@Post('generate')
	@UseGuards(AuthGuard)
	async register(@Res() response: Response, @Body() request: RequestWithUser ) {
		const { otpauthURL } = await this.auth2faService.generate2FASecret( request.userId );
		response.setHeader('content-type', 'image/png');
		return this.auth2faService.createQRCode( response, otpauthURL );
	}

	@Post('turn-on')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async turnOn2fA( @Body() request: RequestWithUser ) {
		const isCodeValid = this.auth2faService.is2fACodeValid(
			request.loginCode, request.userId
		);
		if (!isCodeValid) {
			throw new UnauthorizedException('Wrong authentication code');
		}
		await this.userService.turnOn2fa(request.userId);
		return ("Has habilitado la autenticación en dos pasos. Este cambio será efectivo la siguiente vez que te autentiques en la página.")
	}

	@Post('turn-off')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async turnOff2fA(
		@Body() request: RequestWithUser
	) {
		const isCodeValid = this.auth2faService.is2fACodeValid(
			request.loginCode, request.userId
		);
		if (!isCodeValid) {
			throw new UnauthorizedException('Wrong authentication code');
		}
		await this.userService.turnOff2FA(request.userId);
		return("Has deshabilitado la autenticación en dos pasos.")
	}

	@Post('auth')
	@HttpCode(HttpStatus.OK)
	//@UseGuards(AuthGuard)
	async authenticate(
		@Body() request: RequestWithUser
	) {
		const isCodeValid = this.auth2faService.is2fACodeValid(
			request.loginCode, request.userId
		);
		if (!isCodeValid){
			throw new UnauthorizedException('Wrong authentication code');
		} else {
			return true;
		}
	}
}
