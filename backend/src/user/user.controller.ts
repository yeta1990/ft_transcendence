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
import * as path from 'path';
import {FileInterceptor} from '@nestjs/platform-express'
import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { User } from './user.entity';
import { UserId } from './user.decorator';
import { join } from 'path';
import * as fs from 'fs';

//2 imports added to force login as a user
import { JwtPayload } from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';

import { ValidationFunctions } from '@shared/user.functions'
import { Achievement } from '@shared/achievement';
import { ChatService } from '../chat/chat.service'
import { diskStorage } from 'multer'
import { generateRandomString } from '@shared/functions'
import { extname } from 'path'

@Controller('user')
export class UserController {
	@Inject(UserService)
	private readonly service: UserService;

	@Inject(JwtService)
	private jwtService: JwtService;

	@Inject(ChatService)
	private chatService: ChatService;

	private readonly defaultImagesPath = './uploads';

	@UseGuards(AuthGuard)
	@Get()
	public whoAmI(@UserId() id: number): Promise<User>{
		return this.getUser(id);
	}

	@UseGuards(AuthGuard)
	@Get('default-images')
	public getAllAvatarImages(): any {
	  const avatarImages: { images: string[] } = { images: [] };
	  try {
		const files = fs.readdirSync(this.defaultImagesPath);
		var i = 0;
		files.forEach((file) => {
		  if (file.startsWith('Avatar_')) {
			i += 1;
			avatarImages.images.push(file);
		  }
		});
	  } catch (error) {
	  }
	
	  return avatarImages;
	}


	@UseGuards(AuthGuard)
	@Post('grant-admin')
	public async grantAdmin(@Query('login') login: string, @UserId() id: number): Promise<User[]>{
		if (!login) return;
		const executor: User = await this.service.getUser(id)
		if (!executor) return;
		if (executor.login == login) return [] as User[];
		const hasExecutorPrivileges: boolean = executor.userRole >= 5 ? true : false
		if (!hasExecutorPrivileges) return [] as User[]
		const target: User = await this.service.getUserByLogin(login)
		if (!target) return ;
		const isTargetOwner: boolean = target.userRole >= 6 ? true : false
		if (isTargetOwner) return [] as User[]
		const isTargetBanned: boolean = target.isBanned ? true : false
		if (isTargetBanned) return [] as User[]
		return this.service.grantAdmin(login);
	}

	@UseGuards(AuthGuard)
	@Post('remove-admin')
	public async removeAdmin(@UserId() id: number, @Query('login') login: string): Promise<User[]>{
		if (!login) return;
		const executor: User = await this.service.getUser(id)
		if (!executor) return;
		if (executor.login == login) return [] as User[];
		const hasExecutorPrivileges: boolean = executor.userRole >= 5 ? true : false
		if (!hasExecutorPrivileges) return [] as User[]
		const target: User = await this.service.getUserByLogin(login);
		if (!target) return;
		const isTargetOwner: boolean = target.userRole >= 6 ? true : false
		if (isTargetOwner) return [] as User[]
		return this.service.removeAdmin(login);
	}

	@UseGuards(AuthGuard)
	@Post('ban')
	public async banUserFromWebsite(@UserId() id: number, @Query('login') login: string): Promise<User[]>{
		if (!login) return
		const executor: User = await this.service.getUser(id)
		if (!executor) return;
		if (executor.login == login) return [] as User[];
		const hasExecutorPrivileges: boolean = executor.userRole >= 5 ? true : false
		if (!hasExecutorPrivileges) return [] as User[]
		const target: User = await this.service.getUserByLogin(login)
		if (!target) return
		const isTargetOwner: boolean = target.userRole >= 6 ? true : false
		if (isTargetOwner) return [] as User[]
		return this.service.banUserFromWebsite(login);
	}

	@UseGuards(AuthGuard)
	@Post('unban')
	public async removeBanUserFromWebsite(@UserId() id: number, @Query('login') login: string): Promise<User[]>{
		if (!login) return
		const executor: User = await this.service.getUser(id)
		if (!executor) return;
		if (executor.login == login) return [] as User[];
		const hasExecutorPrivileges: boolean = executor.userRole >= 5 ? true : false
		if (!hasExecutorPrivileges) return [] as User[]
		const target: User = await this.service.getUserByLogin(login)
		if (!target) return
		const isTargetOwner: boolean = target.userRole >= 6 ? true : false
		if (isTargetOwner) return [] as User[]
		return this.service.removeBanUserFromWebsite(login);
	}  

	@UseGuards(AuthGuard)
	@Get('my-blocked')
	public async getMyBlockedUsers(@UserId() id: number): Promise<Array<string>>{
		const user: User = await this.getUser(id)
		if (!user) return [];
  		const bannedUsers: User[] = await this.service
  	  		.getBannedUsersByLogin(user.login)
		return bannedUsers.map(m => m.login)
	}

	@UseGuards(AuthGuard)
	@Post('block')
	public async blockUser(@UserId() id: number, @Query('login') login: string): Promise<Array<string>>{
		if (!login) return;
		const user: User = await this.getUser(id)
		if (!user) return
		if (user.login == login) return
		const blockUser: boolean = await this.chatService.banUser2User(user.login, login)
		return await this.getMyBlockedUsers(id)
	}

	@UseGuards(AuthGuard)
	@Post('unblock')
	public async unBlockUser(@UserId() id: number, @Query('login') login: string): Promise<Array<string>>{
		if (!login) return;
		const user: User = await this.getUser(id)
		if (!user) return
		if (user.login == login) return
		const unBlockUser: boolean = await this.chatService.noBanUser2User(user.login, login)
		return await this.getMyBlockedUsers(id)
	}

	@UseGuards(AuthGuard)
	@Get('friendshiprequest')
	public async requestFriendship(@UserId() id: number, @Query('login') login: string): Promise<any>{
		if (!login) return 
		const user: User = await this.getUser(id)
		if (!user) return
		if (user.login == login) return
		const friendshipSent: boolean = await this.service.requestFriendship(user.login, login)
		return friendshipSent
	}

	@UseGuards(AuthGuard)
	@Post('/friendship/accept')
	public async acceptFriendship(@UserId() id: number, @Query('login') login: string): Promise<Array<string>>{
		if (!login) return 
		const user: User = await this.getUser(id)
		if (!user) return
		if (user.login == login) return
		return await this.service.acceptFriendship(user.login, login)
	}

	@UseGuards(AuthGuard)
	@Post('friendship/request/reject')
	public async rejectFriendshipRequest(@UserId() id: number, @Query('login') login: string): Promise<Array<string>>{
		if (!login) return 
		const user: User = await this.getUser(id)
		if (!user) return
		if (user.login == login) return
		return await this.service.rejectFriendshipRequest(user.login, login)
	}

	@UseGuards(AuthGuard)
	@Post('friendship-remove')
	public async removeFriendship(@UserId() id: number, @Query('login') login: string): Promise<Array<string>>{
		const user: User = await this.getUser(id)
		if (!user) return
		if (user.login == login) return
		return await this.service.removeFriendship(user.login, login)
	}

 
	@UseGuards(AuthGuard)
	@Get('all')
	public async findAll(): Promise<User[]> {
		return await this.service.getAllUsers();
	}

	@UseGuards(AuthGuard)
	@Get(':id')
	public async getUser(@Param('id', ParseIntPipe) id: number): Promise<User>{
		if (!id) return;
		return await this.service.getUser(id);
	}

	@UseGuards(AuthGuard)
	@Get('first-login/:login')
	public async isMyFirst(@UserId() id: number, @Param('login') login: string): Promise<boolean> {
		if (!login) return false
		const user: User = await this.service.getUserByLogin(login);
		if (!user) return false;
		if (user.id != id) return false
		if (user.firstLogin){
			user.firstLogin = false;
			await this.service.saveUser(user)
			return true;
		}
		return false
	}
	
	@UseGuards(AuthGuard)
	@Get('id/:login')
	public getUserIdByLogin(@Param('login') login: string): Promise<number> {
		if (!login) return
		return this.service.getUserIdByLogin(login);
	}

	@UseGuards(AuthGuard)
	@Get(':login/games')
	public async getGamesByUser(@Param('login') login: string): Promise<any> {
		if (!login) return true;
		return await this.service.getGamesByUser(login)
	}

	@UseGuards(AuthGuard)
	@Get(':id/achievements')
	public async getUserAchievements(@Param('id', ParseIntPipe) id: number): Promise<Achievement[]> {
		if (!id) return [] as Achievement[];
	  return await this.service.getUserAchievements(id);
	}

	//we should remove this too
//	@Post()
//	public createUser(@Body() body: CreateUserDto): Promise<User>{
//		return this.service.createUser(body);

//	}

	/* remove this method! only for testing purposes 
	*	is a way to test different users while we don't have a custom
	*	signup and login method
	* */
//	@Get('/force/:login')
//	public async getTokenFromLogin(@Param('login') login: string): Promise<any>{
//		const user: User = await this.service.getUserByLogin(login);
//		const payloadToSign = {login: login, id: user.id, role: user.userRole}
//		const access_token = await this.jwtService.signAsync(payloadToSign);
//		const decoded: JwtPayload = this.jwtService.decode(access_token) as JwtPayload;
//		return {
//			access_token: access_token,
//			expires_at: decoded.exp * 1000, //ms
//		};
//	}

	@UseGuards(AuthGuard)
	@Post('check-username')
	public async checkUsername(@Body() body: { username: string }): Promise<{ isValid: boolean }> {
		const { username } = body;

		if (!username) return { isValid: false }
		const isValidLocal = ValidationFunctions.UsernameValidator(username); // Validación en la lista local
		if (!isValidLocal) {
			return { isValid: false }; // Si el nombre de usuario no es válido en la lista local, devolver false
		}
		
		const existingUser = await this.service.getUserByLogin(username);
		const isValidDB = !existingUser; // Si el usuario no existe, el nombre de usuario es válido en la base de datos

		return { isValid: isValidDB };
	}

	isPNG(fileBuffer) {
	  const pngMagicNumber = fileBuffer.toString('hex', 0, 8);
	  return pngMagicNumber == '89504e470d0a1a0a';
	}

	isJPEG(fileBuffer) {
	  const jpegMagicNumber = fileBuffer.toString('hex', 0, 4);
	  return jpegMagicNumber == 'ffd8ffe0';
	}

	isApple(fileBuffer) {
	  const jpegMagicNumber = fileBuffer.toString('hex', 0, 4);
	  return jpegMagicNumber == 'ffd8ffe1';
	}

	isJPEG2000(fileBuffer) {
  		const jp2MagicNumber = fileBuffer.toString('hex', 4, 12);
  		return jp2MagicNumber == '6a5020200d0a870a';
	}
	isTIFF(fileBuffer) {
  		const tiffMagicNumber = fileBuffer.toString('hex', 0, 4);
  	return tiffMagicNumber == '49492a00' || tiffMagicNumber == '4d4d002a';
	}
	@UseGuards(AuthGuard)
	@Post('upload')
	@UseInterceptors(FileInterceptor('image', {
		limits:{ fileSize: 1048576},
		fileFilter: (req:any , file:any, cb:any) => {
			const allowedMimeTypes = ['image/jpeg', 'image/png'];
			if (!allowedMimeTypes.includes(file.mimetype)) {
				req.fileValidationError = 'Formato de archivo no permitido';
				return cb(null, false, new Error('Formato de archivo no permitido'));
			  }
			cb(null, true)
		},
		storage: diskStorage({
			destination: './uploads',
			filename: (req, file, cb) => {
				var sanitize = require("sanitize-filename");
				const safeFileName = sanitize(generateRandomString(16) + extname(file.originalname));
				cb(null, safeFileName);
			}
		})
	}))
	uploadFile(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
		if (!file) return false;
    	const imagePath = path.join(__dirname, '../../..', 'uploads', file.filename);
		if (fs.existsSync(imagePath)){
			const fileBuffer = fs.readFileSync(imagePath);
			if (!this.isPNG(fileBuffer) && !this.isJPEG(fileBuffer) &&
					!this.isTIFF(fileBuffer) && !this.isJPEG2000(fileBuffer) &&
						!this.isApple(fileBuffer)
			   ){
				//tourists go home!!!
				fs.unlinkSync(imagePath);
				return { error: "Magic number error"};
			}
		}
		if (body.fileValidationError) {
			return { error: body.fileValidationError };
		  }

		  return { image: file.filename };
	}

}
