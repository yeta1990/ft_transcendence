import { Injectable, NotAcceptableException, HttpStatus } from '@nestjs/common';
import { InjectRepository, InjectConnection} from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository, Connection } from 'typeorm';
import { CreateUserDto } from './user.dto';
import { User } from './user.entity';
import { catchError, lastValueFrom, map } from 'rxjs';
import { Achievement } from './achievement/achievement.entity';
import { UserRole } from '@shared/enum';
 
@Injectable()
export class UserService {
	@InjectRepository(User)
	private readonly repository: Repository<User>;

	@InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>;

	constructor(private httpService: HttpService, @InjectConnection() private readonly connection: Connection) {}

	public async getUser(id: number): Promise<User | undefined>{
		return this.repository.findOne({
    		where: {
        		id: id,
    		},
    	})
	}

	public async isUserBannedFromWebsite(login: string): Promise<boolean> {
		const user: User = await this.getUserByLogin(login)
		if (user === null || user === undefined) return false;
		return user.isBanned
	}

	public async getUserIdByLogin(login: string): Promise<number | undefined> {
		const user = await this.repository.findOne({
		  where: {
			login: login,
		  },
		  select: ["id"],
		});
		return user ? user.id : undefined;
	  }

	  //ban user2user
	public async getBannedUsersByLogin(login: string): Promise<User[] | undefined> {
		const user: User = await this.getUserByLogin(login);
		if (!user) return null;
	    return await this.connection.query(
	    	`SELECT f."userId_2" as id, login
	    	FROM user_banned_users_user f
	    	LEFT JOIN public.user ON f."userId_2" = public.user.id 
	    	WHERE (f."userId_1" = $1)`, [user.id]);
	}

	  //ban user2user
	public async getUsersThatHaveBannedAnother(login: string): Promise<User[]> {
		const user: User = await this.getUserByLogin(login);
	    return await this.connection.query(
	    	`SELECT f."userId_1" as id, login
	    	FROM user_banned_users_user f
	    	LEFT JOIN public.user ON f."userId_1" = public.user.id 
	    	WHERE (f."userId_2" = $1)`, [user.id]);
	}

	  //ban user2user
	public async isUserBannedFromUser(executor: string, banned: string): Promise<boolean>{
		const bannedUsers = await this.getBannedUsersByLogin(executor);
		if (!bannedUsers) return false;
		for (let i = 0; i < bannedUsers.length; i++){
			if (bannedUsers[i].login === banned) return true;
		}
		return false;
	}

	public async getUserByLogin(login: string): Promise<User | undefined>{
		return this.repository.findOne({
			relations: ['ownedRooms', 'bannedUsers'],
    		where: {
        		login: login,
    		},
    	})
	}

	public async getUserByLoginWithRooms(login: string): Promise<User | undefined>{
		return this.repository.findOne({
    		where: {
        		login: login,
    		},
    		relations: {
				ownedRooms: true
    		}
    	})
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


	public async createUser(body: CreateUserDto): Promise<User>{
		const alreadyRegisteredUser: User = await this.getUserByLogin(body.login);
		if (alreadyRegisteredUser)
			return (alreadyRegisteredUser)
		if (body.login === "albgarci") body.userRole = UserRole.OWNER

//			throw new NotAcceptableException('User already registered', {cause: new Error(), description: 'User already registered'});

//		const user: User = new User();
//		user.nick = body.nick;
//		user.email = body.email;
//		user.firstName = body.first
		return this.repository.save(body);
	};

	async saveUser(user: User): Promise<User> {
		return await this.repository.save(user);
	}

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

	public async getAllUsers(): Promise<User[]> {
		return await this.repository.find({
			order: {
			  id: 'ASC', // Ordena por ID de manera ascendente (también puedes usar 'DESC' para descendente)
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

	public async hasAdminPrivileges(login: string){
		const role: UserRole = (await this.getUserByLogin(login)).userRole
		return  role == UserRole.ADMIN || role == UserRole.OWNER
	}

	public async isWebOwner(login: string){
		const role: UserRole = (await this.getUserByLogin(login)).userRole
		return role == UserRole.OWNER
	}

}
