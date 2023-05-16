import { CreateUserDto } from './user.dto';
import { User } from './user.entity';
export declare class UserController {
    private readonly service;
    whoAmI(id: number): Promise<User>;
    findAll(): Promise<User[]>;
    getUser(id: number): Promise<User>;
    createUser(body: CreateUserDto): Promise<User>;
}
