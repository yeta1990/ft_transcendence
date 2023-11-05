import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Friend } from './friend/friend.entity'
import { UserStatus, Campuses, UserRole } from '@shared/enum';
import { Achievement } from './achievement/achievement.entity'
import { Room } from '../chat/room.entity';


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
		nullable: false,
		default: UserRole.REGISTRED
	})
	userRole: UserRole;

	@Column({
		default:false
	})
	mfa: boolean;

	@Column({
		nullable: true,
		default: undefined,
	})
	mfaSecret: string;

	@Column('text',{ 
		array: true,
		nullable: true,
		default: [] })
	recoveryCodes: string[];

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
		type: 'int',
		default: 1000
	})
	elo: number;


	// VALIDACION Y SEGURIDAD --------------------------------
    
    // CHATS -------------------------------------------------
	
    @OneToMany(() => Room, (room) => room.owner)
	ownedRooms: Room[]
    
    @ManyToMany(() => Room, (room) => room.users)
	joinedRooms: Room[];

	@ManyToMany(() => Room, (room) => room.admins)
	adminRooms: Room[];

	@ManyToMany(() => Room, (room) => room.banned)
	bannedRooms: Room[];

	@ManyToMany(() => Room, (room) => room.silenced)
	silencedRooms: Room[];

	@ManyToMany(type => User)
	@JoinTable()
	bannedUsers: User[];



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


	//Baneo de usuario de la web
	@Column({
		default:false
	})
	isBanned: boolean

}

