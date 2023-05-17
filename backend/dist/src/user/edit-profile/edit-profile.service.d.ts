import { HttpService } from '@nestjs/axios';
import { User } from '../user.entity';
export declare class EditProfileService {
    private httpService;
    private readonly repository;
    constructor(httpService: HttpService);
    editProfile(newUser: User, id: number): Promise<User>;
}
