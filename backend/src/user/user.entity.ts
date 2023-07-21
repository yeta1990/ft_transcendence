import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { Friend } from './friend/friend.entity'
import { UserStatus, Campuses } from '@shared/enum';
import { Achievement } from './achievement/achievement.entity'

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;
	
	// IDENTIFICACION -------------------------------------

	@Column({
		unique: true,
	})
	nick: string;

	@Column({
		unique: true,
	})
	email: string;
	
	@Column()
	firstName: string;

	@Column()
	lastName: string;

	@Column({
		unique: true,
		nullable: true
	})
	login: string;

		@Column({
		nullable: true,
		default: undefined,
	})
	tokenHash: string;

	@Column({
		nullable: true,
		default: Campuses.Madrid
	})
	campus: Campuses;

	@Column({
		default:false
	})
	mfa: boolean;

	@Column({
		nullable: true,
		default: undefined,
	})
	mfaSecret: string;



	// PERSONALIZACION -------------------------------------

	@Column({
		default: '' //Poner ruta de imagen por defecto
	})
	image: string;

	// ESTADISTICAS Y JUEGO ---------------------------------

	@Column({
		default: UserStatus.OFFLINE
	})
	status: UserStatus;

	@ManyToMany(() => Achievement)
	@JoinTable()
	achievements: Achievement[];

	@Column({
		type: 'int',
		unsigned: true,
		default: 0
	})
	wins: number;

	@Column({ default: 0 })
	winningStreak: number;

	@Column({
		type: 'int',
		unsigned: true,
		default: 0
	})
	losses: number;

	@Column({
		type: 'float',
		default: 0
	})
	elo: number;

	// VALIDACION Y SEGURIDAD --------------------------------



	// AMIGOS ------------------------------------------------

	@ManyToMany(() => Friend)
	@JoinTable({
		name: 'user_friends',
		joinColumns: [
		{
			name: 'user_id',
			referencedColumnName: 'id',
		}
		],
		inverseJoinColumns: [
		{
			name: 'friend_id',
			referencedColumnName: 'id',
		}
		],
	})
	friends: Friend[];

}

