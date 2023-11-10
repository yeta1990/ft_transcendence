import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { InvalidateTokensService } from '../auth/invalidate-tokens.service'

@Injectable()
export class TokenValidationMiddleware implements NestMiddleware {
	constructor(private tokenService: InvalidateTokensService) {}
	async use(req: any, res: any, next: () => void) {
		const authHeader = req.headers['authorization']
		if (authHeader && authHeader.startsWith('Bearer ')){
			const token = authHeader.substring(7);
			if (!(await this.tokenService.isValidToken(token))){
  	  			throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
			}
		}
    next();
	}
}
