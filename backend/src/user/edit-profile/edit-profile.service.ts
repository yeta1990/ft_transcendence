import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../user.dto';
import { User } from '../user.entity';
import { ChatService } from '../../chat/chat.service'
import { UserService } from '../user.service';
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class EditProfileService {
    @InjectRepository(User)
	private readonly repository: Repository<User>;

    constructor(private httpService: HttpService, private chatService: ChatService,@Inject(UserService) private userService: UserService){}

	private readonly defaultImagesPath = './uploads';

	private getAllAvatarImages(): any {
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

    private deleteImage(filename: string){
    	const imagePath = path.join(__dirname, '../../../..', 'uploads', filename);
		if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    public async editProfile(newUser: User, id: number) : Promise<User | boolean> {
        const user =  await this.repository.findOne({
                where: {
                    id: id,
                },
            })
        if (!user) return false;
        if (user.login !== newUser.login) return false
        if (user.email !== newUser.email) return false
        if (user.nick !== newUser.nick){
        	const nickIsAvailable = await this.userService.isNickAvailable(newUser.nick);
        	if (!nickIsAvailable) return false
        	if (newUser.nick.length != 8) return false
        }
		if (newUser.firstName.length > 30) return false
		if (newUser.lastName.length > 30) return false

        const oldImage = user.image

		const avatarImages = this.getAllAvatarImages().images
		
		if (!avatarImages.includes(oldImage) && oldImage !== newUser.image) this.deleteImage(oldImage)

        this.chatService.editActiveUser(newUser)
	
        user.image = newUser.image
        user.nick = newUser.nick
        user.firstName = newUser.firstName
        user.lastName = newUser.lastName
        return this.repository.save(user);
    }  
}
