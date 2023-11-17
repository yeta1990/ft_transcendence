import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../user.dto';
import { User } from '../user.entity';
import { ChatService } from '../../chat/chat.service'
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class EditProfileService {
    @InjectRepository(User)
	private readonly repository: Repository<User>;

    constructor(private httpService: HttpService, private chatService: ChatService) {}

    private deleteImage(filename: string){
    	const imagePath = path.join(__dirname, '../../../..', 'uploads', filename);
    	console.log("deleting image")
    	console.log(imagePath)
		if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    public async editProfile(newUser: User, id: number) : Promise<User> {
        const user =  await this.repository.findOne({
                where: {
                    id: id,
                },
            })

        const oldImage = user.image
		if (oldImage !== "avatar.png" && oldImage !== newUser.image) this.deleteImage(oldImage)

        let userUpdate = await this.repository
            .createQueryBuilder()
            .update(User)
            .set(newUser)
            .where("id = :id", { id: id})
            .execute()
        this.chatService.editActiveUser(newUser)
        console.log(newUser)
        return this.repository.save(newUser);
    }  
}
