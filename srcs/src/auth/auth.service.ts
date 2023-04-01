import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private jwtService: JwtService
	) {}

	async signIn(nick: string, email: string): Promise<any> {
		const user = await this.userService.getUserByNick(nick);
		if (user === undefined){
			throw new UnauthorizedException();
		}
		const payload = { nick: user.nick, sub: user.id };
		return {
			access_token: await this.jwtService.signAsync(payload)
		};
	}
}
