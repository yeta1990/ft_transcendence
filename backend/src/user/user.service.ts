import { Injectable, NotAcceptableException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { CreateUserDto } from './user.dto';
import { User } from './user.entity';
import { catchError, lastValueFrom, map } from 'rxjs';

@Injectable()
export class UserService {
	@InjectRepository(User)
	private readonly repository: Repository<User>;

	constructor(private httpService: HttpService) {}

	public async getUser(id: number): Promise<User | undefined>{
		return this.repository.findOne({
    		where: {
        		id: id,
    		},
    	})
	}

	public async getUserByNick(nick: string): Promise<User | undefined>{
		return this.repository.findOne({
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
//		console.log("ye");
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

