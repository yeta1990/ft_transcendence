import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service'
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity'
import { Friend } from './friend/friend.entity'
import { Game } from '../pong/game.entity'
import { Achievement } from './achievement/achievement.entity';
import { AchievementService } from './achievement/achievement.service';
import { HttpModule } from '@nestjs/axios';
import { EditProfileController } from './edit-profile/edit-profile.controller';
import { EditProfileService } from './edit-profile/edit-profile.service';
import {ChatModule} from '../chat/chat.module'

@Module({
	// es necesario importar el Type....forFeature en cada módulo donde queramos acceder a los métodos del ORM
	imports: [TypeOrmModule.forFeature([Achievement, Friend, User, Game]), HttpModule, forwardRef(() => ChatModule) ],
	providers: [UserService, EditProfileService, AchievementService],
	exports: [UserService, EditProfileService],
	controllers: [EditProfileController],
})
export class UserModule {}
