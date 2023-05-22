import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module'

import { User } from './user/user.entity'
import { Room } from './chat/room.entity'
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { HttpModule } from '@nestjs/axios';
import { EventsModule } from './events/events.module';
import { ChatModule } from './chat/chat.module';
 
@Module({
  imports: [
  	ConfigModule.forRoot({
		envFilePath: '.env',
	}),
	AuthModule,
	UserModule,
	TypeOrmModule.forRoot({
		type: 'postgres',
		host: process.env.POSTGRES_HOST,
		port: parseInt(process.env.POSTGRES_PORT),
		username: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		database: process.env.POSTGRES_DATABASE,
		entities: [User, Room],
		synchronize: true, // creo que esto hay que cambiarlo para subirlo a producción
	}),
	HttpModule,
	EventsModule,
	ChatModule,
  ],
  controllers: [AppController, UserController],
  providers: [AppService]
})
export class AppModule {}
