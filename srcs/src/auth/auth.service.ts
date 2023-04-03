import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map } from 'rxjs';


@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private jwtService: JwtService,
		private httpService: HttpService
	) {}

	
	async confirmAuthFrom42(code: string): Promise<any>{
		const data  = await lastValueFrom(
			this.httpService.post('https://api.intra.42.fr/oauth/token', 
				null,
			  {params: {
			  	  	grant_type:'authorization_code',
					host: process.env.POSTGRES_HOST,
					client_id: process.env.CLIENT_ID_42,
					client_secret: process.env.CLIENT_SECRET_42,
					code: code,
					redirect_uri: process.env.REDIRECT_URI_42
					}
				})
				.pipe(
					map(res => res.data)
				)
		);
		return data;
	}

	async signIn(code: string): Promise<any> {

		try{
			const data = await this.confirmAuthFrom42(code);
			console.log(data);
		}
		catch(error){
			throw new UnauthorizedException();
		}
		const user = { nick: "nick", id: 1 };

		const payload = { nick: user.nick, id: user.id }; //all requests from the frontend will contain this info
		const access_token = await this.jwtService.signAsync(payload);
		const decoded: JwtPayload = this.jwtService.decode(access_token) as JwtPayload;
		return {
			access_token: access_token,
			expires_at: decoded.exp * 1000, //ms
		};
	}
}
