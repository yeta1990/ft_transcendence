import { UserStatus, Campuses, UserRole } from '@shared/enum';
import { Achievement } from '@shared/achievement';

export class User {
	id: number;
	nick: string;
	email: string;
	firstName: string;
	lastName: string;
	login: string;
	tokenHash: string;
	campus: Campuses;
	userRole: UserRole;
	mfa: boolean;
	mfaSecret: string;
	image: string;
	status: UserStatus;
	achievements: Achievement[];
	wins: number;
	winningStreak: number;
	losses: number;
	elo: number;

	constructor(model: User) {
		this.id = model && model.id;
		this.nick = model && model.nick;
		this.email = model && model.email;
		this.firstName = model && model.firstName;
		this.lastName = model && model.lastName;
		this.login = model && model.login;
		this.tokenHash = model && model.tokenHash;
		this.campus = model && model.campus;
		this.userRole = model && model.userRole;
		this.mfa = model && model.mfa;
		this.mfaSecret = model && model.mfaSecret;
		this.image = model && model.image;
		this.status = model && model.status;
		this.achievements = model && model.achievements;
		this.wins = model && model.wins;
		this.winningStreak = model && model.winningStreak;
		this.losses = model && model.losses;
		this.elo = model && model.elo;
	}
}
