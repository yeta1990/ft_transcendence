import { Module } from '@nestjs/common';
import { UserService } from './user.service'
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity'

@Module({
	// es necesario importar el Type....forFeature en cada módulo donde queramos acceder a los métodos del ORM
	imports: [TypeOrmModule.forFeature([User])], 
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
