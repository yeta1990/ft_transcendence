import { Injectable, NotAcceptableException, HttpStatus } from '@nestjs/common';
import { InjectRepository, InjectConnection} from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository, Connection } from 'typeorm';
import { CreateUserDto } from './user.dto';
import { User } from './user.entity';
import { catchError, lastValueFrom, map } from 'rxjs';

@Injectable()
export class UserService {
	@InjectRepository(User)
	private readonly repository: Repository<User>;

	constructor(private httpService: HttpService, @InjectConnection() private readonly connection: Connection) {}

	public async getUser(id: number): Promise<User | undefined>{
		return this.repository.findOne({
    		where: {
        		id: id,
    		},
    	})
	}

	public async getBannedUsersByNick(nick: string): Promise<User[] | undefined> {
		const user: User = await this.getUserByNick(nick);
		if (!user) return null;
	    return await this.connection.query(
	    	`SELECT f."userId_2" as id, nick
	    	FROM user_banned_users_user f
	    	LEFT JOIN public.user ON f."userId_2" = public.user.id 
	    	WHERE (f."userId_1" = $1)`, [user.id]);
	}

	public async getUsersThatHaveBannedAnother(nick: string): Promise<User[]> {
		const user: User = await this.getUserByNick(nick);
	    return await this.connection.query(
	    	`SELECT f."userId_1" as id, nick
	    	FROM user_banned_users_user f
	    	LEFT JOIN public.user ON f."userId_1" = public.user.id 
	    	WHERE (f."userId_2" = $1)`, [user.id]);
	}

	public async isUserBannedFromUser(executor: string, banned: string): Promise<boolean>{
		const bannedUsers = await this.getBannedUsersByNick(executor);
		if (!bannedUsers) return false;
		for (let i = 0; i < bannedUsers.length; i++){
			if (bannedUsers[i].nick === banned) return true;
		}
		return false;
	}

	public async getUserByNick(nick: string): Promise<User | undefined>{
		return this.repository.findOne({
			relations: ['ownedRooms', 'bannedUsers'],
    		where: {
        		nick: nick,
    		},
    	})
	}

	public async getUserByNickWithRooms(nick: string): Promise<User | undefined>{
		return this.repository.findOne({
    		where: {
        		nick: nick,
    		},
    		relations: {
				ownedRooms: true
    		}
    	})
	}

	public async createUser(body: CreateUserDto): Promise<User>{
		const alreadyRegisteredUser: User = await this.getUserByNick(body.nick);
		if (alreadyRegisteredUser)
			return (alreadyRegisteredUser)

//			throw new NotAcceptableException('User already registered', {cause: new Error(), description: 'User already registered'});

//		const user: User = new User();
//		user.nick = body.nick;
//		user.email = body.email;
//		user.firstName = body.first
		return this.repository.save(body);
	};

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
		return await this.repository.find();
	}
}

