import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectConnection} from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository, Connection } from 'typeorm';
import {InvalidTokens} from './invalid-tokens-entity'
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service'
import { UserRole } from '@shared/enum';


@Injectable()
export class InvalidateTokensService {
	@InjectRepository(InvalidTokens)
	private readonly repository: Repository<InvalidTokens>;

	constructor(private httpService: HttpService, @InjectConnection() private readonly connection: Connection, public authService: AuthService, public userService:UserService) {}

	public async invalidateToken(token: string): Promise<void>{
		const t = new InvalidTokens()	
		t.token = token
		this.repository.save(t)
	}

	public async isValidToken(token: string): Promise<boolean>{
		const t = await this.repository.findOne({
			where: {
				token: token
			}
		})
		if (t !== null) return false;
		const tokenPrivileges: string | undefined  = UserRole[this.authService.getUserRoleFromJwt(token)]
		const tokenLogin = this.authService.getLoginFromJwt(token)
		const user = await this.userService.getUserByLogin(tokenLogin)
		if (user == undefined) return true;
		const realPrivileges: string | undefined = UserRole[user.userRole]

		if (tokenPrivileges != realPrivileges){ 
			await this.invalidateToken(token)
			return false;
		}
		return true 
	}
}
