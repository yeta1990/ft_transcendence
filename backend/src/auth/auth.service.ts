import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map } from 'rxjs';

export interface authData42 {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	created_at: number;
}
 
@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private jwtService: JwtService,
		private httpService: HttpService
	) {}

	async confirmAuthFrom42(code: string): Promise<any>{
		const data  = await lastValueFrom(
			this.httpService.post(
				'https://api.intra.42.fr/oauth/token', 
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
//		const allUserData42;
		let data: authData42;
		try{
			data = await this.confirmAuthFrom42(code);
//			console.log(data);

		}
		catch(error){
			throw new UnauthorizedException();
		}

		//get user data from 42
//		console.log(data.access_token);
		const allUserData42 = await this.userService.whoAmI(data.access_token);
//		console.log(allUserData42);	

		//check if user exists in db: getByNick.
//		const registeredUser = await this.userService.getUserByNick(allUserData42.login)

		//if it doesn't exist, create user
		//create payload with nick and id, sign it and send back to client

//		const user: User = this.userService.getUser(
//		const user = { nick: login, id: 1 };

		const payloadToCreateUser = { nick: allUserData42.login, email: allUserData42.email, firstName: allUserData42.first_name, lastName: allUserData42.last_name, login: allUserData42.login, image: allUserData42.image.versions.medium }; //all requests from the frontend will contain this info
		const createdUser = await this.userService.createUser(payloadToCreateUser);

		const payloadToSign = {nick: createdUser.nick, id: createdUser.id}
		const access_token = await this.jwtService.signAsync(payloadToSign);
		const decoded: JwtPayload = this.jwtService.decode(access_token) as JwtPayload;
		return {
			access_token: access_token,
			expires_at: decoded.exp * 1000, //ms
		};
	}

	getIdFromJwt(token: string): number{
		const decoded: JwtPayload = this.jwtService.decode(token) as JwtPayload;
		return parseInt(decoded.id)
	}

	getNickFromJwt(token: string): string{
		const decoded: JwtPayload = this.jwtService.decode(token) as JwtPayload;
		return (decoded.nick)
	}

	async verifyJwt(token: string): Promise<boolean> {
    	if (!token) {
    	  throw new UnauthorizedException();
    	}
    	try {
    	  const payload = await this.jwtService.verifyAsync(
    	    token,
    	    {
    	      secret: 'santanabanana'
    	    }
    	  );
    	  // 💡 We're assigning the payload to the request object here
    	  // so that we can access it in our route handlers
//    	  request['user'] = payload;
			
    	} catch {
    		return false;
//    	  throw new UnauthorizedException();
    	}
    	return true;
    }

}
