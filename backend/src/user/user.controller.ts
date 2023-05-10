import {
	Controller, 
	Body, 
	Inject, 
	Get, 
	ParseIntPipe, 
	Param, 
	Post,
	UseGuards
} from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';

import { UserService } from './user.service';
import { CreateUserDto } from './user.dto';
import { User } from './user.entity';
import { UserId } from './user.decorator';

@Controller('user')
export class UserController {
	@Inject(UserService)
	private readonly service: UserService;

	@UseGuards(AuthGuard)
	@Get()
	public whoAmI(@UserId() id: number): Promise<User>{
		return this.getUser(id);
	}

	@Get('all')
	public findAll(): string{
		return "All users"
	}

	@Get(':id')
	public getUser(@Param('id', ParseIntPipe) id: number): Promise<User>{
		return this.service.getUser(id);
	}

	@Post()
	public createUser(@Body() body: CreateUserDto): Promise<User>{
		return this.service.createUser(body);

	}
}
