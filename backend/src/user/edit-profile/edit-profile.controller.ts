import { Controller, Inject, UseGuards, Post, Param, Body, InternalServerErrorException } from '@nestjs/common';
import { User } from '../user.entity';
import { AuthGuard } from '../../auth/auth.guard';
import { EditProfileService } from './edit-profile.service';
import { UserService } from '../user.service';
import { UserId } from '../user.decorator';

@Controller('edit-profile')
export class EditProfileController {
    @Inject(EditProfileService)
	private readonly editProfileService: EditProfileService;
    @Inject(UserService)
    private userService: UserService;

	@UseGuards(AuthGuard)
    @Post('user/edit')
    public edit(@Body() user: User, @UserId() id: number): Promise<User> {
        console.log("user image: " + user.image);
        return(this.editProfileService.editProfile(user, id));
    } 

    @UseGuards(AuthGuard)
    @Post('check-nick')
    async checkNickAvailability(@Body() data: { nick: string }): Promise<any> {
        console.log('Received request with data:', data);
        const isAvailable = await this.userService.isNickAvailable(data.nick);
        console.log('Nick availability checked successfully');
        return isAvailable;
    }
}