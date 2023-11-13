import {
	Controller, 
	Body, 
	Inject, 
	Get, 
	ParseIntPipe, 
	Param, 
	Post,
	UseGuards,
	Query,
	UploadedFile,
	UseInterceptors,
	ParseFilePipeBuilder,
	HttpStatus

} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import {FileInterceptor} from '@nestjs/platform-express'
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { User } from './user.entity';
import { UserId } from './user.decorator';

//2 imports added to force login as a user
import { JwtPayload } from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';

import { ValidationFunctions } from '@shared/user.functions'
import { Achievement } from '@shared/achievement';
import { ChatService } from '../chat/chat.service'
import { diskStorage } from 'multer'

@Controller('user')
export class UserController {
	@Inject(UserService)
	private readonly service: UserService;

	@Inject(JwtService)
	private jwtService: JwtService;

	@Inject(ChatService)
	private chatService: ChatService;

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
		const target: User = await this.service.getUserByLogin(login)
		const isTargetOwner: boolean = target.userRole >= 6 ? true : false
		if (isTargetOwner) return [] as User[]
		const isTargetBanned: boolean = target.isBanned ? true : false
		if (isTargetBanned) return [] as User[]
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

	@UseGuards(AuthGuard)
	@Get('my-blocked')
	public async getMyBlockedUsers(@UserId() id: number): Promise<Array<string>>{
		const user: User = await this.getUser(id)
  		const bannedUsers: User[] = await this.service
  	  		.getBannedUsersByLogin(user.login)
		return bannedUsers.map(m => m.login)
	}

	@UseGuards(AuthGuard)
	@Post('block')
	public async blockUser(@UserId() id: number, @Query('login') login: string): Promise<Array<string>>{
		const user: User = await this.getUser(id)
		const blockUser: boolean = await this.chatService.banUser2User(user.login, login)
		return await this.getMyBlockedUsers(id)
	}

	@UseGuards(AuthGuard)
	@Post('unblock')
	public async unBlockUser(@UserId() id: number, @Query('login') login: string): Promise<Array<string>>{
		const user: User = await this.getUser(id)
		const unBlockUser: boolean = await this.chatService.noBanUser2User(user.login, login)
		return await this.getMyBlockedUsers(id)
	}

	@UseGuards(AuthGuard)
	@Get('friendshiprequest')
	public async requestFriendship(@UserId() id: number, @Query('login') login: string): Promise<any>{
		console.log("yee")
		const user: User = await this.getUser(id)
		const friendshipSent: boolean = await this.service.requestFriendship(user.login, login)
		return friendshipSent
	}

	@UseGuards(AuthGuard)
	@Post('/friendship/accept')
	public async acceptFriendship(@UserId() id: number, @Query('login') login: string): Promise<Array<string>>{
		const user: User = await this.getUser(id)
		return await this.service.acceptFriendship(user.login, login)
	}

	@UseGuards(AuthGuard)
	@Post('friendship/request/reject')
	public async rejectFriendshipRequest(@UserId() id: number, @Query('login') login: string): Promise<Array<string>>{
		const user: User = await this.getUser(id)
		return await this.service.rejectFriendshipRequest(user.login, login)
	}

	@UseGuards(AuthGuard)
	@Post('friendship-remove')
	public async removeFriendship(@UserId() id: number, @Query('login') login: string): Promise<Array<string>>{
		console.log("yee")
		const user: User = await this.getUser(id)
		return await this.service.removeFriendship(user.login, login)
	}

 

	@Get('all')
	public findAll(): Promise<User[]> {
		return this.service.getAllUsers();
	}
	
	@UseGuards(AuthGuard)
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
	
	@UseGuards(AuthGuard)
	@Post('upload')
	@UseInterceptors(FileInterceptor('image', {
		limits:{ fileSize: 1048576},
		fileFilter: (req:any , file:any, cb:any) => {
			cb(null, true)
		},
		storage: diskStorage({
			destination: './uploads',
			filename: (req, file, cb) => {
				cb(null, file.originalname)
			}
		})
	}))
	uploadFile(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
		if (!file) {
			console.log("no file")
		}
		console.log(body)
		return {image: file.filename}
	}
	

}
