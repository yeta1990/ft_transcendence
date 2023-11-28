
import { UserRole } from '@shared/enum'
export class CreateUserDto{
//  id: number;
	nick: string; // Opcional
	firstName: string;
	lastName: string;
	login: string; //Opcional
	image: string; //Opcional
	email: string;
	userRole: UserRole;
}
