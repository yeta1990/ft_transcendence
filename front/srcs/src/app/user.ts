export class User {
	id: number;
	name: string;
	nick: string;
	email: string;

	constructor(model: User) {
		this.id = model && model.id;
		this.name = model && model.name;
		this.nick = model && model.nick;
		this.email = model && model.email;
	}
}
