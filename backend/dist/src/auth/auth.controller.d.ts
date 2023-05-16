import { AuthService } from './auth.service';
interface LoginBody {
    code: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: LoginBody): Promise<any>;
    getProfile(req: any): any;
}
export {};
