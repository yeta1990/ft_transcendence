import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './user/user.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
  	ConfigModule.forRoot({
		envFilePath: '.env',
	}),
	TypeOrmModule.forRoot({
		type: 'postgres',
		host: process.env.POSTGRES_HOST,
		port: parseInt(process.env.POSTGRES_PORT),
		username: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		database: process.env.POSTGRES_DATABASE,
		entities: [],
		synchronize: true,
	}),
  ],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
