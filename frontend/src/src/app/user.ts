import { UserStatus } from '@shared/enum';

export class User {
	id: number;
	nick: string;
	firstName: string;
	lastName: string;
	login: string;
	image: string;
	status: UserStatus;
	email: string;

	constructor(model: User) {
		this.id = model && model.id;
		this.nick = model && model.nick;
		this.firstName = model && model.firstName;
		this.lastName = model && model.lastName;
		this.login = model && model.login;
		this.image = model && model.image;
		this.status = model && model.status;
		this.email = model && model.email;
	}
}
