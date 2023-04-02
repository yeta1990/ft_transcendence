import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private jwtService: JwtService
	) {}

	async signIn(nick: string, email: string): Promise<any> {
		const user = await this.userService.getUserByNick(nick);
		if (user == undefined){
			throw new UnauthorizedException();
		}

		const payload = { nick: user.nick, id: user.id }; //all requests from the frontend will contain this info
		const access_token = await this.jwtService.signAsync(payload);
		const decoded: JwtPayload = this.jwtService.decode(access_token) as JwtPayload;
		return {
			access_token: access_token,
			expires_at: decoded.exp * 1000, //ms
		};
	}
}
