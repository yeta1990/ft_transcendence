import {
	Controller, 
	Body, 
	Inject, 
	Get, 
	ParseIntPipe, 
	Param, 
	Post,
	UseGuards,
	Query
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';

import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { User } from './user.entity';
import { UserId } from './user.decorator';

//2 imports added to force login as a user
import { JwtPayload } from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';

import { ValidationFunctions } from '@shared/user.functions'
import { Achievement } from '@shared/achievement';

@Controller('user')
export class UserController {
	@Inject(UserService)
	private readonly service: UserService;

	@Inject(JwtService)
	private jwtService: JwtService;

	@UseGuards(AuthGuard)
	@Get()
	public whoAmI(@UserId() id: number): Promise<User>{
		return this.getUser(id);
	}

	@UseGuards(AuthGuard)
	@Post('grant-admin')
	public async grantAdmin(@Query('login') login: string, @UserId() id: number): Promise<User[]>{
		const hasExecutorPrivileges: boolean = (await this.service.getUser(id)).userRole >= 5 ? true : false
		if (!hasExecutorPrivileges) return [] as User[]
		const isTargetOwner: boolean = (await this.service.getUserByLogin(login)).userRole >= 6 ? true : false
		if (isTargetOwner) return [] as User[]
		return this.service.grantAdmin(login);
	}

	@UseGuards(AuthGuard)
	@Post('remove-admin')
	public async removeAdmin(@UserId() id: number, @Query('login') login: string): Promise<User[]>{
		const hasExecutorPrivileges: boolean = (await this.service.getUser(id)).userRole >= 5 ? true : false
		if (!hasExecutorPrivileges) return [] as User[]
		const isTargetOwner: boolean = (await this.service.getUserByLogin(login)).userRole >= 6 ? true : false
		if (isTargetOwner) return [] as User[]
		return this.service.removeAdmin(login);
	}

	@UseGuards(AuthGuard)
	@Post('ban')
	public async banUserFromWebsite(@UserId() id: number, @Query('login') login: string): Promise<User[]>{
		const hasExecutorPrivileges: boolean = (await this.service.getUser(id)).userRole >= 5 ? true : false
		if (!hasExecutorPrivileges) return [] as User[]
		const isTargetOwner: boolean = (await this.service.getUserByLogin(login)).userRole >= 6 ? true : false
		if (isTargetOwner) return [] as User[]
		return this.service.banUserFromWebsite(login);
	}

	@UseGuards(AuthGuard)
	@Post('unban')
	public async removeBanUserFromWebsite(@UserId() id: number, @Query('login') login: string): Promise<User[]>{
		const hasExecutorPrivileges: boolean = (await this.service.getUser(id)).userRole >= 5 ? true : false
		if (!hasExecutorPrivileges) return [] as User[]
		const isTargetOwner: boolean = (await this.service.getUserByLogin(login)).userRole >= 6 ? true : false
		if (isTargetOwner) return [] as User[]
		return this.service.removeBanUserFromWebsite(login);
	}
 
	@Get('all')
	public findAll(): Promise<User[]> {
		return this.service.getAllUsers();
	}

	@Get(':id')
	public getUser(@Param('id', ParseIntPipe) id: number): Promise<User>{
		return this.service.getUser(id);
	}
	
	//@UseGuards(AuthGuard)
	@Get('id/:login')
	public getUserIdByLogin(@Param('login') login: string): Promise<number> {
	  return this.service.getUserIdByLogin(login);
	}

	//@UseGuards(AuthGuard)
	@Get(':id/achievements')
	public getUserAchievements(@Param('id', ParseIntPipe) id: number): Promise<Achievement[]> {
	  return this.service.getUserAchievements(id);
	}


	@Post()
	public createUser(@Body() body: CreateUserDto): Promise<User>{
		return this.service.createUser(body);

	}

	/* remove this method! only for testing purposes 
	*	is a way to test different users while we don't have a custom
	*	signup and login method
	* */
	@Get('/force/:login')
	public async getTokenFromLogin(@Param('login') login: string): Promise<any>{
		const user: User = await this.service.getUserByLogin(login);
		const payloadToSign = {login: login, id: user.id, role: user.userRole}
		const access_token = await this.jwtService.signAsync(payloadToSign);
		const decoded: JwtPayload = this.jwtService.decode(access_token) as JwtPayload;
		return {
			access_token: access_token,
			expires_at: decoded.exp * 1000, //ms
		};
	}

	@Post('check-username')
	public async checkUsername(@Body() body: { username: string }): Promise<{ isValid: boolean }> {
		const { username } = body;

		const isValidLocal = ValidationFunctions.UsernameValidator(username); // Validación en la lista local
		if (!isValidLocal) {
			return { isValid: false }; // Si el nombre de usuario no es válido en la lista local, devolver false
		}
		
		const existingUser = await this.service.getUserByLogin(username);
		const isValidDB = !existingUser; // Si el usuario no existe, el nombre de usuario es válido en la base de datos

		return { isValid: isValidDB };
	}

	

}
