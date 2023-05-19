import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { Friend } from './friend/friend.entity'
import { Achievement, UserStatus } from '@shared/enum';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;
	
	// IDENTIFICACION -------------------------------------

	@Column({
		unique: true,
	})
	nick: string;
	
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

	@Column('enum', {
		enum: Achievement,
		array: true,
		default: []
	})
	achievements: Achievement[];

	@Column({
		type: 'int',
		unsigned: true,
		default: 0
	})
	wins: number;
  
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

	@Column({
		unique: true,
	})
	email: string;

	@Column({
		default:false
	})
	mfa: boolean;

	@Column({
		nullable: true,
		default: undefined,
	})
	mfaSecret: string;

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

