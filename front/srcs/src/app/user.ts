export class User {
	id: number;
	nick: string;
	firstName: string;
	lastName: string;
	email: string;
	image: string;
	login: string;

	constructor(model: User) {
		this.id = model && model.id;
		this.firstName = model && model.firstName;
		this.lastName = model && model.lastName;
		this.nick = model && model.nick;
		this.email = model && model.email;
		this.image = model && model.image;
		this.login = model && model.login;
	}
}
