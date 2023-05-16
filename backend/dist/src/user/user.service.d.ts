import { HttpService } from '@nestjs/axios';
import { CreateUserDto } from './user.dto';
import { User } from './user.entity';
export declare class UserService {
    private httpService;
    private readonly repository;
    constructor(httpService: HttpService);
    getUser(id: number): Promise<User | undefined>;
    getUserByNick(nick: string): Promise<User | undefined>;
    createUser(body: CreateUserDto): Promise<User>;
    whoAmI(token: string): Promise<any>;
    getAllUsers(): Promise<User[]>;
}
