import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module'
import { JwtModule} from '@nestjs/jwt';

@Module({
	imports: [
		UserModule, 
		JwtModule.register({
    		global: true,
    		secret: 'santanabanana',
    		signOptions: { expiresIn: '86400s' },
    	}),
    ],
	controllers: [AuthController],
	providers: [AuthService],
	exports: [AuthService]
})
export class AuthModule {}
