import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { EntityManager } from 'typeorm';
import { User } from '../user/user.entity';
import { UserRole } from '@shared/enum'
import { stringify } from 'querystring';

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
		private httpService: HttpService,
		private entityManager: EntityManager
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

	async signIn(code: string ): Promise<any> {
		let data: authData42;
		try{
			data = await this.confirmAuthFrom42(code);
		}
		catch(error){
			return false;
		}

		const allUserData42 = await this.userService.whoAmI(data.access_token);
		const payloadToCreateUser = this.createPayloadForUser(allUserData42);
		const user: User = await this.userService.getUserByLogin(payloadToCreateUser.login);
		if (user && user.isBanned) {
			return false;
		}
		const createdUser = await this.createNewUser(payloadToCreateUser);

		const tokenData = await this.generateTokenData(createdUser);
		return {
			requiresMFA: createdUser.mfa,
			userId: createdUser.id,
			authResult: {
			  access_token: tokenData.access_token,
			  expires_at: tokenData.expires_at,
			},
		  };
	}

	createPayloadForUser(userData: any): any {
		return { 
			nick: userData.login,
			email: userData.email,
			firstName: userData.first_name,
			lastName: userData.last_name,
			login: userData.login,
			userRole: UserRole.REGISTRED
		};
	}


	async createNewUser(userData: any): Promise<User> {
		return await this.userService.createUser(userData);
	}

	async generateTokenData(user: User): Promise<any> {
		const payloadToSign = {
			login: user.login,
			id: user.id,
			role: user.userRole
		};
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

	getLoginFromJwt(token: string): string{
		const decoded: JwtPayload = this.jwtService.decode(token) as JwtPayload;
		if (!decoded) return null
		return (decoded.login)
	}

	getUserRoleFromJwt(token: string): string {
		const decoded: JwtPayload = this.jwtService.decode(token) as JwtPayload;
		if (!decoded)
			return ("1")
		return (decoded.role)
	}

	async verifyJwt(token: string): Promise<boolean> {
		if (!token) {
			throw new UnauthorizedException();
		}
		try {
			const payload = await this.jwtService.verifyAsync(
				token, {
					secret: 'santanabanana'
				}
			);
		} catch {
			return false;
		}
		return true;
	}

}
