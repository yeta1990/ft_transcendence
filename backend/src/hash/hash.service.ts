import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

//https://docs.nestjs.com/security/encryption-and-hashing
@Injectable()
export class HashService {

	saltOrRounds: number = 10;

	hashPassword(password: string): Promise<string>{
		return bcrypt.hash(password, this.saltOrRounds);
	}

	comparePassword(password: string, hash: string): Promise<boolean>{
		return bcrypt.compare(password, hash);
	}
}
