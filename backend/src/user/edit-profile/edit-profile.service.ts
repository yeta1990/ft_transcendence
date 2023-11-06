import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../user.dto';
import { User } from '../user.entity';


@Injectable()
export class EditProfileService {
    @InjectRepository(User)
	private readonly repository: Repository<User>;

    constructor(private httpService: HttpService) {}

    public async editProfile(newUser: User, id: number) : Promise<User> {
        let userUpdate = await this.repository
            .createQueryBuilder()
            .update(User)
            .set(newUser)
            .where("id = :id", { id: id})
            .execute()
        return this.repository.save(newUser);
    }  
}