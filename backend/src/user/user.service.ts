import { Injectable, NotAcceptableException, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository, InjectConnection} from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository, Connection } from 'typeorm';
import { CreateUserDto } from './user.dto';
import { User } from './user.entity';
import { Game } from '../pong/game.entity'
import { catchError, lastValueFrom, map } from 'rxjs';
import { Achievement } from './achievement/achievement.entity';
import { AchievementService } from './achievement/achievement.service';
import { UserRole } from '@shared/enum';
 
@Injectable()
export class UserService {
	@InjectRepository(User)
	private readonly repository: Repository<User>;

	@InjectRepository(Game)
	private readonly gameRepository: Repository<Game>;

	@InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>;

	constructor(private httpService: HttpService, private achievementService: AchievementService, @InjectConnection() private readonly connection: Connection) {}


	public async whoAmI(token: string): Promise<any>
	{
		const data  = await lastValueFrom(
			this.httpService.get(
				'https://api.intra.42.fr/v2/me',
				{headers: {
			  	 	Authorization: `Bearer ${token}`,
					}
				})
				.pipe(
					map(res => res.data)
				)
		);
		return data;
	}
 
	public async createUser(body: CreateUserDto): Promise<User>{
		const alreadyRegisteredUser: User = await this.getUserByLogin(body.login);
		if (alreadyRegisteredUser)
			return (alreadyRegisteredUser)
		if (body.login === "albgarci") body.userRole = UserRole.OWNER
		return await this.repository.save(body);
	};

	async saveUser(newUser: User): Promise<User> {
		return await this.repository.save(newUser);
	}

	//____________________________ GETTERS ________________________________

	public async getUser(id: number) : Promise<User | undefined> {
		const user = await this.repository.findOne({
			where: {
				id: id,
			},
		})
		if (user) {
			return user;
		}
		throw new HttpException('User not found', HttpStatus.NOT_FOUND);
	}

	public async getUserByLogin(login: string): Promise<User | undefined>{
		const user =  await this.repository.findOne({
			relations: ['ownedRooms', 'bannedUsers', 'achievements'],
			where: {
				login: login,
			},
		})
		if (user) {
			return user;
		}
		return null
	}

	async getUserByEmail( email: string ){
		const user = await this.repository.findOne({ 
			where: {
				email: email,
			},
		});
		if (user) {
			return user;
		}
		throw new HttpException('User with this email does not exist', HttpStatus.NOT_FOUND);
	}

	public async getAllUsers(): Promise<User[]> {
		return await this.repository.find({
			order: {
			  id: 'ASC', // (también puedes usar 'DESC' para descendente)
			}});
	}

	public async getUserAchievements(id: number): Promise<Achievement[]> {
		
		const user = await this.repository
			.createQueryBuilder("user")
			.leftJoinAndSelect("user.achievements", "achievement")
			.where("user.id = :id", { id: id })
			.getOne();
		if (user) {
			console.log("User Achievements:", user.achievements);
			return user.achievements;
		} else {
			console.log("User not found.");
			return [] as Achievement[];
		}
	}

	public async getUserIdByLogin(login: string): Promise<number | undefined> {
		const user = await this.repository.findOne({
			where: {
			login: login,
			},
			select: ["id"],
		})
		if (user) {
			return user.id;
		}
		return -1
	}

	//____________________________ WEB ADMIN ________________________________

	public async isUserBannedFromWebsite(login: string): Promise<boolean> {
		const user: User = await this.getUserByLogin(login)
		if (user === null || user === undefined) return false;
		return user.isBanned
	}

		public async grantAdmin(login: string): Promise<User[]>{
		console.log(login)
		const user: User = await this.getUserByLogin(login)
		user.userRole = UserRole.ADMIN
		await this.saveUser(user)
		return this.getAllUsers()
	}

	public async removeAdmin(login: string): Promise<User[]>{
		const user: User = await this.getUserByLogin(login)
		user.userRole = UserRole.REGISTRED
		await this.saveUser(user)
		return this.getAllUsers()
	}

	public async banUserFromWebsite(login: string): Promise<User[]>{
		const user: User = await this.getUserByLogin(login)
		//by changing the role, we force to logout that user
		user.userRole = UserRole.VISITOR
		user.isBanned = true;

		await this.saveUser(user)
		return this.getAllUsers()
	}

	public async removeBanUserFromWebsite(login: string): Promise<User[]>{
		const user: User = await this.getUserByLogin(login)
		//by changing the role, we force to logout that user
		user.userRole = UserRole.REGISTRED
		user.isBanned = false;

		await this.saveUser(user)
		return this.getAllUsers()
	}

	public async hasAdminPrivileges(login: string){
		const role: UserRole = (await this.getUserByLogin(login)).userRole
		return  role == UserRole.ADMIN || role == UserRole.OWNER
	}

	public async isWebOwner(login: string){
		const role: UserRole = (await this.getUserByLogin(login)).userRole
		return role == UserRole.OWNER
	}

	//____________________________ CHAT USER SERVICE ____________________________

	public async getUserByLoginWithRooms(login: string): Promise<User | undefined>{
		const user =  await this.repository.findOne({
			where: {
				login: login,
			},
			relations: {
				ownedRooms: true
			}
		})
		if (user) {
			return user;
		}
		throw new HttpException('User not found', HttpStatus.NOT_FOUND);
	}

	//____________________________ BAN USER2USER ________________________________

	public async getBannedUsersByLogin(login: string): Promise<User[] | undefined> {
		const user: User = await this.getUserByLogin(login);
		if (!user) return null;
		return await this.connection.query(
			`SELECT f."userId_2" as id, login
			FROM user_banned_users_user f
			LEFT JOIN public.user ON f."userId_2" = public.user.id 
			WHERE (f."userId_1" = $1)`, [user.id]);
	}

	public async getUsersThatHaveBannedAnother(login: string): Promise<User[]> {
		const user: User = await this.getUserByLogin(login);
		return await this.connection.query(
			`SELECT f."userId_1" as id, login
			FROM user_banned_users_user f
			LEFT JOIN public.user ON f."userId_1" = public.user.id 
			WHERE (f."userId_2" = $1)`, [user.id]);
	}

	public async thereIsABlock(executor: string, banned: string): Promise<boolean>{
		const usersThatHaveBannedAnother: User[] = await this.getUsersThatHaveBannedAnother(banned)
		const loginsBlockers = usersThatHaveBannedAnother.map(u => u.login)
		console.log(loginsBlockers)
		return (loginsBlockers.includes(executor))
	}

	public async isUserBannedFromUser(executor: string, banned: string): Promise<boolean>{
		const bannedUsers = await this.getBannedUsersByLogin(executor);
		if (!bannedUsers) return false;
		for (let i = 0; i < bannedUsers.length; i++){
			if (bannedUsers[i].login === banned) return true;
		}
		return false;
	}

	//______________________________ MFA ___________________________________

	async set2FASecret( secret: string, userId: number ) {
		const existingUser = await this.getUser(userId);
		if (!existingUser) {
			throw new Error('User with ID ${userId} not found');
		}
		return await this.repository.update(userId, {
			mfaSecret: secret
		});
	}

	async turnOn2fa ( userId: number ) {
		const existingUser = await this.getUser(userId);
		if (!existingUser) {
			throw new Error('User with ID ${userId} not found');
		}
		return await this.repository.update( userId, {
			mfa: true
		});
	}

	async turnOff2FA(userId: number): Promise<void> {
		const existingUser = await this.getUser(userId);
		if (!existingUser) {
			throw new Error('User with ID ${userId} not found');
		}
		await this.repository.update( userId, {
			mfa: false
		});
	  }

	public async requestFriendship(senderLogin: string, targetLogin: string): Promise<boolean>{
		if (senderLogin === targetLogin) return false;
		const sender: User = await this.getUserByLogin(senderLogin)
		if (!sender) return false;
		if (sender.incomingFriendRequests.includes(targetLogin)){
			await this.acceptFriendship(senderLogin, targetLogin)
			return true;
		}
		const user: User = await this.getUserByLogin(targetLogin)
		if (!user) return false;
		const friendRequests: Set<string> = new Set(user.incomingFriendRequests)
		friendRequests.add(senderLogin)	
		user.incomingFriendRequests = Array.from(friendRequests)
		await this.repository.save(user)
		return true;
	}

	public async acceptFriendship(acceptorLogin: string, pendingFriendLogin: string): Promise<Array<string>>{
		const user: User = await this.getUserByLogin(acceptorLogin)
		const newFriend: User = await this.getUserByLogin(pendingFriendLogin)
		if (!newFriend) return null;
		const friendRequests: Set<string> = new Set(user.incomingFriendRequests)

		if (friendRequests.has(pendingFriendLogin)){
			user.friends ? user.friends.push(pendingFriendLogin) : user.friends = [pendingFriendLogin]
			user.friends = Array.from(new Set(user.friends))
			user.incomingFriendRequests = Array.from(friendRequests).filter(f => f != pendingFriendLogin)
			newFriend.friends ? newFriend.friends.push(acceptorLogin) : newFriend.friends = [acceptorLogin]
			newFriend.friends = Array.from(new Set(newFriend.friends))
			await this.repository.save(user)
			await this.repository.save(newFriend)
		}
		return user.friends
	}

	public async rejectFriendshipRequest(rejectorLogin: string, pendingFriendLogin: string): Promise<Array<string>>{
		const user: User = await this.getUserByLogin(rejectorLogin)
		const friendRequests: Set<string> = new Set(user.incomingFriendRequests)
	    user.incomingFriendRequests = user.incomingFriendRequests.filter(f => f !== pendingFriendLogin)
		await this.repository.save(user)
		return user.incomingFriendRequests;
	}

	public async removeFriendship(friend1: string, friend2: string): Promise<Array<string>>{
		console.log(friend1+friend2)
		if (friend1 === friend2) return null;
		const user1: User = await this.getUserByLogin(friend1)
		const user2: User = await this.getUserByLogin(friend2)

		user1.friends = user1.friends.filter(f => f != friend2)
		user2.friends = user2.friends.filter(f => f != friend1)
		await this.repository.save(user1)
		await this.repository.save(user2)
		console.log(user1.friends)
		console.log(user2.friends)
		return user1.friends;
	}

	//games
	public async getGamesByUser(login): Promise<any>{
		return this.gameRepository.find({
			where: [{player1: login}, {player2:login}]
		})
	
	}

  	public async getAchievementByName(name: string): Promise<Achievement | undefined>{
  		const achievement: Achievement | undefined  = await this.achievementService.getAchievementByName(name)
		return achievement
  	}
	
}
