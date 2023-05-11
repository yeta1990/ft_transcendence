import { User } from '../user.entity';
export declare class EditProfileController {
    private readonly service;
    edit(user: User, id: number): Promise<User>;
}
