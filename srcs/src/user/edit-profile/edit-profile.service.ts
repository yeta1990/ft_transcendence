import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../user.dto';
import { User } from '../user.entity';


@Injectable()
export class EditProfileService {
    //@InjectRepository(User)
	private readonly repository: Repository<User>;

    constructor(private httpService: HttpService) {}

    public async editProfile(newUser: User) : Promise<User>{
        let user = await this.repository.findOne({
    		where: {
        		id: newUser.id,
    		},
    	})
            //.createQueryBuilder()
            //.update(User)
            //.set({ firstName: "", lastName: "",
            //    nick: "", email: "",
            //    image: ""})
            //.where("id = :id", { id: 1 })
            //.execute()
            user.firstName = newUser.firstName;
            user.lastName = newUser.lastName;
            user.nick = newUser.nick;
            user.email = newUser.email;
            user.image = newUser.image;
            return (user);
    }  
}