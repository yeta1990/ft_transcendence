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
		host: 'tx_postgres',
		port: 5432,
		username: 'postgres',
		password: '1234',
		database: 'postgres',
		entities: [],
		synchronize: true,
	}),
  ],
  controllers: [AppController, UserController],
  providers: [AppService],
})
export class AppModule {}
