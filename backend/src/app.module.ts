import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, getConnection, UsingJoinTableIsNotAllowedError } from 'typeorm';

import { AuthModule } from './auth/auth.module'
import { AuthController } from './auth/auth.controller'

import { User } from './user/user.entity'
import { Friend } from './user/friend/friend.entity'
import { Achievement } from './user/achievement/achievement.entity'
import { AchievementService } from './user/achievement/achievement.service';
import { Room } from './chat/room.entity'
import { ChatMessage } from './chat/chat-message/chat-message.entity'
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { HttpModule } from '@nestjs/axios';
import { EventsModule } from './events/events.module';
import { ChatModule } from './chat/chat.module';
import { HashService } from './hash/hash.service';
import {InvalidTokens} from './auth/invalid-tokens-entity'
import { TokenValidationMiddleware } from './token-validation/token-validation.middleware'
import * as Joi from 'joi';
import { config } from 'process';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
 
@Module({
  imports: [
  	ConfigModule.forRoot({
		validationSchema: Joi.object({
			POSTGRES_HOST: Joi.string().required(),
			POSTGRES_PORT: Joi.number().required(),
			POSTGRES_USER: Joi.string().required(),
			POSTGRES_PASSWORD: Joi.string().required(),
			POSTGRES_DATABASE: Joi.string().required(),
			PORT: Joi.number(),
		}),
		envFilePath: '.env',
	}),
	ServeStaticModule.forRoot({
		rootPath: join(__dirname, '../..', 'uploads'),
		serveRoot: '/uploads',
	}),
	AuthModule,
	UserModule,
	TypeOrmModule.forRootAsync({
		imports: [ConfigModule],
		inject: [ConfigService],
		useFactory: (configService: ConfigService) => ({ 
			type: 'postgres',
			host: configService.get('POSTGRES_HOST'),
			port: configService.get('POSTGRES_PORT'),
			username: configService.get('POSTGRES_USER'),
			password: configService.get('POSTGRES_PASSWORD'),
			database: configService.get('POSTGRES_DATABASE'),
			entities: [User, Friend, Achievement, Room, ChatMessage, InvalidTokens],
			synchronize: true, // creo que esto hay que cambiarlo para subirlo a producción
			logging: false //useful for debugging errors in typeorm/postgres
		})
	}),
	HttpModule,
	EventsModule,
	ChatModule,
	TypeOrmModule.forFeature([Achievement]),
  ],
  controllers: [AppController, UserController],
  providers: [AppService, HashService, AchievementService]
})
export class AppModule implements NestModule{
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(TokenValidationMiddleware)
			.forRoutes(UserController, AuthController)
	}
}
