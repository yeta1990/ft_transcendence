import { Injectable, NotAcceptableException, HttpStatus } from '@nestjs/common';
import { InjectRepository, InjectConnection} from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository, Connection } from 'typeorm';
import { CreateUserDto } from './user.dto';
import { User } from './user.entity';
import { catchError, lastValueFrom, map } from 'rxjs';
import { Achievement } from './achievement/achievement.entity';
 
@Injectable()
export class UserService {
	@InjectRepository(User)
	private readonly repository: Repository<User>;

	@InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>;

	constructor(private httpService: HttpService, @InjectConnection() private readonly connection: Connection) {}

	public async getUser(id: number): Promise<User | undefined>{
		return await this.repository.findOne({
    		where: {
        		id: id,
    		},
    	})
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

	public async isUserBannedFromUser(executor: string, banned: string): Promise<boolean>{
		const bannedUsers = await this.getBannedUsersByLogin(executor);
		if (!bannedUsers) return false;
		for (let i = 0; i < bannedUsers.length; i++){
			if (bannedUsers[i].login === banned) return true;
		}
		return false;
	}

	public async getUserByLogin(login: string): Promise<User | undefined>{
		return await this.repository.findOne({
			relations: ['ownedRooms', 'bannedUsers'],
    		where: {
        		login: login,
    		},
    	})
	}

	public async getUserByLoginWithRooms(login: string): Promise<User | undefined>{
		return await this.repository.findOne({
    		where: {
        		login: login,
    		},
    		relations: {
				ownedRooms: true
    		}
    	})
	}

	public async createUser(body: CreateUserDto): Promise<User>{
		const alreadyRegisteredUser: User = await this.getUserByLogin(body.login);
		if (alreadyRegisteredUser)
			return (alreadyRegisteredUser)

//			throw new NotAcceptableException('User already registered', {cause: new Error(), description: 'User already registered'});

//		const user: User = new User();
//		user.nick = body.nick;
//		user.email = body.email;
//		user.firstName = body.first
		return await this.repository.save(body);
	};

	async saveUser(newUser: User): Promise<User> {
		console.log("SAVING: MFA of user is: " + newUser.mfa.valueOf());
	  
		const id = newUser.id;
	  
		console.log(newUser)
		try {
		  // Intenta ejecutar la actualización
		  let updateResult = await this.repository
			.createQueryBuilder()
			.update(User)
			.set(newUser)
			.where("id = :id", { id: id })
			.execute();
	  
			console.log(await this.getUser(id));
		  // Verifica el resultado de la actualización
		  if (updateResult.affected && updateResult.affected > 0) {
			console.log(`User with ID ${id} updated successfully.`);
		  } else {
			console.log(`No user was updated for ID ${id}.`);
		  }
		} catch (error) {
		  console.error("Error updating user:", error);
		  throw error; // Puedes lanzar el error nuevamente o manejarlo según tus necesidades
		}
	  
		// Finalmente, guarda y devuelve el objeto actualizado
		return await this.repository.save(newUser);
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
}
