import { Controller, Get, Param } from '@nestjs/common';

@Controller('users')
export class UserController {
	@Get()
	findAll(): string{
		return "All users"
	}
	@Get(':id')
	findOne(@Param() params){
		return {
			id: params.id,
			name: "pepe"
		}
	}
}
