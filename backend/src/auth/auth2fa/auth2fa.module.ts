import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from '../auth.module';
import { Auth2faController } from './auth2fa.controller';
import { Auth2faService } from './auth2fa.service';
import { forwardRef } from '@nestjs/common';

@Module({
	imports: [UserModule, ConfigModule, forwardRef(() => AuthModule)],
	controllers: [Auth2faController],
	providers: [Auth2faService]
})
export class Auth2faModule {}
