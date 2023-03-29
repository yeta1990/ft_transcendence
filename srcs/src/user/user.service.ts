import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './user.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
	@InjectRepository(User)
	private readonly repository: Repository<User>;

	public getUser(id): Promise<User>{
		return this.repository.findOne({
    		where: {
        		id: id,
    		},
    	})
	}

	public createUser(body: CreateUserDto): Promise<User>{
		const user: User = new User();

		user.nick = body.nick;
		user.email = body.email;
		return this.repository.save(user);
	};
}
