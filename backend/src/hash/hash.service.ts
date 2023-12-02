import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as CryptoJS from 'crypto-js';

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

	private readonly key: string = "do you know teenage fanclub? it's the best band of the world"
	encrypt(toEncrypt: string){
		return CryptoJS.AES.encrypt(toEncrypt, this.key).toString()
	}

	decrypt(encrypted: string){
		return CryptoJS.AES.decrypt(encrypted, this.key).toString(CryptoJS.enc.Utf8);
	}
}
