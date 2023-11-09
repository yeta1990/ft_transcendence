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
	async register(@Res() response: Response, @Req() request: RequestWithUser ) {
		const { otpauthURL } = await this.auth2faService.generate2FASecret( request.userId );

		return this.auth2faService.createQRCode( response, otpauthURL );
	}

	@Post('turn-on')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async turnOn2fA(
		@Req() request: RequestWithUser,
		@Body() { code2fa } : CodeDto2fa
	) {
		const isCodeValid = this.auth2faService.is2fACodeValid(
			code2fa, request.userId
		);
		if (!isCodeValid) {
			throw new UnauthorizedException('Wrong authentication code');
		}
		await this.userService.turnOn2fa(request.userId);
	}

	@Post('auth')
	@HttpCode(HttpStatus.OK)
	@UseGuards(AuthGuard)
	async authenticate(
		@Req() request: RequestWithUser,
		@Body() { code2fa } : CodeDto2fa
	) {
		const isCodeValid = this.auth2faService.is2fACodeValid(
			code2fa, request.userId
		);
		if (!isCodeValid){
			throw new UnauthorizedException('Wrong authentication code');
		}

		return this.authService.signIn(request.loginCode, true );

	}
}
