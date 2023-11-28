import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module'
import { JwtModule} from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { InvalidateTokensService } from './invalidate-tokens.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {InvalidTokens} from './invalid-tokens-entity'
import { Auth2faModule } from './auth2fa/auth2fa.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([InvalidTokens]),
		UserModule, 
		JwtModule.register({
    		global: true,
    		secret: 'santanabanana',
    		signOptions: { expiresIn: '86400s' },
    	}),
		HttpModule,
		Auth2faModule,
    ],

	controllers: [AuthController],
	providers: [AuthService, InvalidateTokensService],
	exports: [AuthService, InvalidateTokensService]
})
export class AuthModule {}
