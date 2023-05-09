import { Controller, Inject, UseGuards, Post, Param, Body } from '@nestjs/common';
import { User } from '../user.entity';
import { AuthGuard } from '../../auth/auth.guard';
import { EditProfileService } from './edit-profile.service';
import { UserId } from '../user.decorator';

@Controller('edit-profile')
export class EditProfileController {
    @Inject(EditProfileService)
	private readonly service: EditProfileService;

	@UseGuards(AuthGuard)
    @Post('user/edit')
    public edit(@Body() user: User, @UserId() id: number): Promise<User> {
        return(this.service.editProfile(user, id));
    } 
}