import { Controller, Inject, UseGuards, Post, Param } from '@nestjs/common';
import { User } from '../user.entity';
import { AuthGuard } from '../../auth/auth.guard';
import { EditProfileService } from './edit-profile.service';

@Controller('edit-profile')
export class EditProfileController {
    @Inject(EditProfileService)
	private readonly service: EditProfileService;

	@UseGuards(AuthGuard)
    @Post('user/edit')
    public edit(@Param() user): Promise<User> {
        return(this.service.editProfile(user));
    } 
}